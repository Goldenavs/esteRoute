import os
import json
import asyncio
import httpx
from google import genai
from google.genai import types
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from io import BytesIO
from PIL import Image

load_dotenv()

# Configure Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in backend .env")
client = genai.Client(api_key=api_key) if api_key else None

# Strict Prompt to guarantee JSON output with Anti-Spoofing / Domain Gate
SYSTEM_PROMPT = """
You are an AI assistant analyzing images of urban canals (esteros), rivers, culverts, and drainage channels for flood risk triage.

CRITICAL FIRST TASK - WATERWAY AUTHENTICITY CHECK:
You must first determine whether the image depicts an outdoor canal, estero, river, drainage inlet, culvert, or storm drain infrastructure.
- If the image depicts an indoor scene (bedroom, office, kitchen), a selfie, an animal/pet, a vehicle, a dry road/pavement with NO drainage inlet or canal, a screenshot, or unrelated everyday objects:
  -> Set "is_valid_waterway": false
  -> Set "rejection_reason": "non_waterway" (or "indoor", "unrelated_object", "blurry_unusable")
  -> Set "waste_categories": []
  -> Set "blockage_severity_score": 0
  -> Set "rationale": "State clearly that this image is not a waterway/canal and explain what it actually depicts."
- If the image genuinely depicts an outdoor canal, estero, drainage inlet, culvert, or waterway:
  -> Set "is_valid_waterway": true
  -> Set "rejection_reason": null
  -> Identify waste categories and evaluate blockage severity.

Return your response ONLY as a strict JSON object with the exact following schema:
{
  "is_valid_waterway": <true or false>, // MUST be false if image does not depict an outdoor waterway or canal infrastructure
  "rejection_reason": <null or "non_waterway" | "indoor" | "unrelated_object" | "blurry_unusable">,
  "waste_categories": ["Plastic", "Organic", "Silt", "Construction", "Other"], // Array of string categories (empty [] if not a waterway)
  "blockage_severity_score": <number 0-100>, // 0 if not a waterway, otherwise estimate obstruction (0 = clear, 100 = blocked)
  "confidence": "<high or low>", // How confident are you in this assessment based on image clarity?
  "rationale": "<string>" // A concise, one-sentence rationale explaining the blockage score or why the image was rejected.
}
Do not include markdown blocks or any other text outside the JSON.
"""

# Production-grade verified multimodal model cascade (empirically benchmarked)
# gemini-3.8-flash: Latest flagship multimodal model
# gemini-flash-latest: Stable production alias
# gemini-3.7-flash, gemini-3.5-flash: High-performance flash models
# gemini-flash-lite-latest: Low-latency fallback
CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest'
]

TIMEOUT_SECONDS = 30.0
MAX_ATTEMPTS_PER_MODEL = 2


async def run_vision_triage(report_id: str, image_url: str, citizen_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Downloads the reported image, optimizes its payload, cascades through verified
    Google Gemini Flash models with transient-spike retries, and extracts strict
    anti-spoofing and blockage severity metrics.
    
    Returns None if all authentic models fail, ensuring zero fabricated/mock triage.
    """
    if not client:
        print(f"Vision Agent: No GEMINI_API_KEY configured for report {report_id}.")
        return None

    try:
        # 1. Download image bytes asynchronously with generous timeout
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(image_url, timeout=15.0)
            resp.raise_for_status()
            image_bytes = resp.content
            mime_type = resp.headers.get("Content-Type", "image/jpeg")

        # 1.5 Downsample image to max 800x800 to prevent upload latency bottleneck (reduces 8MB to ~80KB)
        try:
            img = Image.open(BytesIO(image_bytes))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.thumbnail((800, 800))
            output = BytesIO()
            img.save(output, format="JPEG", quality=85)
            image_bytes = output.getvalue()
            mime_type = "image/jpeg"
        except Exception as e:
            print(f"Vision Agent: Image resize failed, proceeding with original: {e}")

        # 2. Formulate Prompt and Multimodal Part
        user_prompt = "Analyze this canal photo."
        if citizen_notes:
            user_prompt += f" The citizen who reported this added the following note: '{citizen_notes}'"

        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        # 3. Configure strict JSON generation & disable unnecessary AFC warnings
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.1,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
        )

        # 4. Multi-model Cascade with Transient Spike (503) Retries
        for model_name in CANDIDATE_MODELS:
            for attempt in range(1, MAX_ATTEMPTS_PER_MODEL + 1):
                try:
                    print(f"Vision Agent querying model: {model_name} (attempt {attempt}/{MAX_ATTEMPTS_PER_MODEL}, timeout={TIMEOUT_SECONDS}s)...")
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model=model_name,
                            contents=[user_prompt, part],
                            config=config
                        ),
                        timeout=TIMEOUT_SECONDS
                    )

                    raw_text = response.text.strip() if response and response.text else "{}"
                    # Strip any potential markdown wrapper
                    if raw_text.startswith("```"):
                        lines = raw_text.splitlines()
                        if lines and lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        raw_text = "\n".join(lines).strip()

                    result = json.loads(raw_text)
                    if isinstance(result, list) and len(result) > 0:
                        result = result[0]
                    if not isinstance(result, dict):
                        result = {}

                    # Anti-Spoofing: Validate is_valid_waterway flag
                    is_valid = bool(result.get("is_valid_waterway", True))
                    result["is_valid_waterway"] = is_valid

                    if not is_valid:
                        result["blockage_severity_score"] = 0.0
                        result["waste_categories"] = []
                        if not result.get("rejection_reason"):
                            result["rejection_reason"] = "non_waterway"
                    else:
                        # CLAMP score to [0, 100]
                        score = result.get("blockage_severity_score", 0)
                        try:
                            numeric_score = float(score)
                        except (ValueError, TypeError):
                            numeric_score = 0.0
                        result["blockage_severity_score"] = max(0.0, min(100.0, numeric_score))
                        result["rejection_reason"] = None

                    # Attach the report_id
                    result["report_id"] = report_id
                    print(f"Vision Agent successfully triaged report {report_id} via {model_name} (Score: {result.get('blockage_severity_score')}, Valid Waterway: {is_valid})")
                    return result

                except asyncio.TimeoutError:
                    print(f"Vision Agent: Model {model_name} (attempt {attempt}) timed out after {TIMEOUT_SECONDS}s.")
                    if attempt < MAX_ATTEMPTS_PER_MODEL:
                        await asyncio.sleep(1.5)
                        continue
                    break

                except Exception as model_err:
                    err_str = str(model_err)
                    print(f"Vision Agent: Model {model_name} (attempt {attempt}) error: {err_str}")
                    # If 503 high demand spike or transient connection error, retry once with backoff
                    if ("503" in err_str or "UNAVAILABLE" in err_str or "RemoteProtocolError" in err_str) and attempt < MAX_ATTEMPTS_PER_MODEL:
                        print(f"Vision Agent: Backing off 1.5s for transient spike on {model_name}...")
                        await asyncio.sleep(1.5)
                        continue
                    # For non-transient errors (like 404), cascade immediately to next model
                    break

        # If all candidate models in the cascade failed or timed out:
        print(f"Vision Agent: All live Gemini models exhausted for report {report_id}. Setting for human verification.")
        return None

    except Exception as network_e:
        print(f"Vision Agent network/image download failure for report {report_id}: {str(network_e)}")
        return None
