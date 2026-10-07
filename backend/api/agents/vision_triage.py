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

# Strict Prompt to guarantee JSON output
SYSTEM_PROMPT = """
You are an AI assistant analyzing images of urban canals (esteros) for flood risk triage.
Your goal is to identify blockages, debris, and waste in the canal.

Return your response ONLY as a strict JSON object with the exact following schema:
{
  "waste_categories": ["Plastic", "Organic", "Silt", "Construction", "Other"], // Array of string categories found
  "blockage_severity_score": <number 0-100>, // Estimate how obstructed the water flow is (0 = clear, 100 = completely blocked)
  "confidence": "<high or low>", // How confident are you in this assessment based on image clarity?
  "rationale": "<string>" // A concise, one-sentence rationale for the severity score.
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
                
                result = json.loads(response.text)
                
                # CLAMP score to [0, 100]
                score = result.get("blockage_severity_score", 0)
                result["blockage_severity_score"] = max(0, min(100, float(score)))
                
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
