import os
import json
import asyncio
import httpx
import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY not found in backend .env")

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
        async with httpx.AsyncClient() as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            image_bytes = resp.content
            mime_type = resp.headers.get("Content-Type", "image/jpeg")

        # 2. Setup Gemini Model
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # 3. Formulate Prompt
        user_prompt = "Analyze this canal photo."
        if citizen_notes:
            user_prompt += f" The citizen who reported this added the following note: '{citizen_notes}'"

        # 4. Call Gemini with retry logic (3s backoff)
        max_retries = 2
        for attempt in range(max_retries):
            try:
                # Use to_thread since the generativeai SDK can be blocking
                response = await asyncio.to_thread(
                    model.generate_content,
                    [user_prompt, {"mime_type": mime_type, "data": image_bytes}]
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
