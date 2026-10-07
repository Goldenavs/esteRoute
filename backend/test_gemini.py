import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

SYSTEM_PROMPT = "test"
user_prompt = "test"
mime_type = "image/jpeg"
b64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

payload = {
    "system_instruction": {
        "parts": [{"text": SYSTEM_PROMPT}]
    },
    "contents": [
        {
            "parts": [
                {"text": user_prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": b64_image
                    }
                }
            ]
        }
    ],
    "generationConfig": {
        "responseMimeType": "application/json"
    }
}

gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
response = httpx.post(gemini_url, json=payload, timeout=20.0)
print("STATUS CODE:", response.status_code)
print("RESPONSE TEXT:", response.text)
