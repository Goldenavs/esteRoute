from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    supabase: Client = None
    print("WARNING: Supabase URL or Key is missing. Database operations will fail.")
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/")
async def create_report(
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    notes: Optional[str] = Form(None)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")

    # 1. Generate tracking reference (e.g. ER-2026-XXXXXX)
    tracking_reference = f"ER-2026-{str(uuid.uuid4().int)[:6]}"
    
    # 2. Upload photo to Supabase Storage
    try:
        file_ext = photo.filename.split(".")[-1] if "." in photo.filename else "jpg"
        file_name = f"{tracking_reference}.{file_ext}"
        
        file_bytes = await photo.read()
        
        # Upload to canal-photos bucket
        res = supabase.storage.from_("canal-photos").upload(
            file_name,
            file_bytes,
            {"content-type": photo.content_type}
        )
        
        # Get public URL
        image_url = supabase.storage.from_("canal-photos").get_public_url(file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
        
    # 3. Insert into database
    try:
        data = {
            "tracking_reference": tracking_reference,
            "image_url": image_url,
            "latitude": latitude,
            "longitude": longitude,
            "citizen_notes": notes,
            "status": "pending_analysis"
        }
        
        db_res = supabase.table("reports").insert(data).execute()
        
        # Return success with the tracking reference for the frontend confirmation screen
        return {
            "message": "Report submitted successfully",
            "tracking_reference": tracking_reference,
            "report_id": db_res.data[0]["report_id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report to database: {str(e)}")
