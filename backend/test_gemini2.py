import os
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

async def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    print("Testing gemini-3.8-flash...")
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.8-flash',
            contents="Say hello!",
            # Notice we are NOT passing GenerateContentConfig with JSON response_mime_type
        )
        print("Success! Response:", response.text)
    except Exception as e:
        print("Failed:", str(e))

if __name__ == "__main__":
    asyncio.run(main())
