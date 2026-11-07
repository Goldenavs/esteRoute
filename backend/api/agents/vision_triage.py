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

async def run_vision_triage(report_id: str, image_url: str, citizen_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Downloads the reported image, sends it to Gemini 3.8 Flash,
    and returns the clamped blockage severity and categories.
    """
    if not client:
        print("Vision Agent aborted: No API Key.")
        return None

    try:
        # 1. Download image bytes asynchronously
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(image_url, timeout=10.0)
            resp.raise_for_status()
            image_bytes = resp.content
            mime_type = resp.headers.get("Content-Type", "image/jpeg")

        # 1.5 Resize image to max 800x800 to prevent massive upload bottleneck (reduces 8MB to ~100KB)
        try:
            img = Image.open(BytesIO(image_bytes))
            # Convert to RGB in case it's PNG with transparency
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.thumbnail((800, 800))
            output = BytesIO()
            img.save(output, format="JPEG", quality=85)
            image_bytes = output.getvalue()
            mime_type = "image/jpeg"
        except Exception as e:
            print(f"Image resize failed, proceeding with original: {e}")

        # 2. Formulate Prompt and Data
        user_prompt = "Analyze this canal photo."
        if citizen_notes:
            user_prompt += f" The citizen who reported this added the following note: '{citizen_notes}'"
            
        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        # 3. Call Gemini with retry logic (3s backoff)
        max_retries = 2
        for attempt in range(max_retries):
            try:
                # We remove GenerateContentConfig because it triggers an unstable Automatic Function Calling (AFC) mode in the SDK
                # Wrap in asyncio.wait_for to guarantee it never hangs for more than 15 seconds if Google's servers go down
                try:
                    response = await asyncio.wait_for(
                        client.aio.models.generate_content(
                            model='gemini-3.8-flash',
                            contents=[SYSTEM_PROMPT, user_prompt, part]
                        ),
                        timeout=15.0
                    )
                except asyncio.TimeoutError:
                    print(f"Attempt {attempt + 1}: Gemini API timed out after 15 seconds.")
                    if attempt == max_retries - 1:
                        return None
                    await asyncio.sleep(3)
                    continue
                
                raw_text = response.text.strip() if response and response.text else "{}"
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
                
                return result
                
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"Vision Agent failed after {max_retries} attempts: {str(e)}")
                    return None
                await asyncio.sleep(3)
                
    except Exception as network_e:
        print(f"Vision Agent network failure: {str(network_e)}")
        return None
