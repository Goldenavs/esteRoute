from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from supabase import create_client, Client
from dotenv import load_dotenv

from dotenv import load_dotenv
from api.orchestrator import triage_report_pipeline

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
    background_tasks: BackgroundTasks,
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
        report_id = db_res.data[0]["report_id"]

        # Trigger Phase 4 Multi-Agent Triage Pipeline in the background!
        background_tasks.add_task(
            triage_report_pipeline,
            report_id=report_id,
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
            citizen_notes=notes
        )
        
        # Return success with the tracking reference for the frontend confirmation screen
        return {
            "message": "Report submitted successfully",
            "tracking_reference": tracking_reference,
            "report_id": report_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report to database: {str(e)}")

@router.get("/{report_id}/agent-log")
async def get_agent_log(report_id: str):
    """
    4.5 Agent Execution Logging & Transparency Endpoint
    Returns the raw agent outputs for a given report to expose the AI's reasoning.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")
        
    try:
        # Fetch all agent results associated with this report
        res = supabase.table("agent_results").select("*").eq("report_id", report_id).execute()
        
        return {
            "report_id": report_id,
            "agent_logs": res.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent logs: {str(e)}")

class StatusUpdateRequest(BaseModel):
    status: str

@router.patch("/{report_id}/status")
async def update_report_status(report_id: str, payload: StatusUpdateRequest):
    """
    Phase 5.5 Dispatcher Status Transition Controls & Audit Log
    Updates the report status and inserts a record into the dispatch_status_log table.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")
        
    try:
        # 1. Update report status
        supabase.table("reports").update({"status": payload.status}).eq("report_id", report_id).execute()
        
        # 2. Insert into dispatch_status_log
        supabase.table("dispatch_status_log").insert({
            "report_id": report_id,
            "to_status": payload.status
        }).execute()
        
        return {"message": f"Status updated to {payload.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

