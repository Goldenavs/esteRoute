import os
import json
import asyncio
import httpx
from google import genai
from google.genai import types
from typing import Dict, Any, Optional
from dotenv import load_dotenv

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
    Downloads the reported image, sends it to Gemini 1.5 Flash, 
    and returns the clamped blockage severity and categories.
    """
    try:
        # 1. Download image bytes asynchronously
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            mime_type = resp.headers.get("Content-Type", "image/jpeg")

        if not client:
            print("Vision Agent aborted: No API Key.")
            return None

        # 2. Formulate Prompt and Data
        user_prompt = "Analyze this canal photo."
        if citizen_notes:
            user_prompt += f" The citizen who reported this added the following note: '{citizen_notes}'"
            
        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        # 3. Call Gemini with retry logic (3s backoff)
        max_retries = 2
        for attempt in range(max_retries):
            try:
                # Use to_thread since the synchronous genai SDK can be blocking
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model='gemini-3.8-flash',
                    contents=[user_prompt, part],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json"
                    )
                )
                
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
