import os
import uuid
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from supabase import Client, ClientOptions, create_client

# Ensure backend root environment variables are loaded
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
load_dotenv()

from api.auth import (
    AuthenticatedUser,
    get_optional_user,
    require_admin_or_dispatcher,
)
from api.logger import log_transaction
from api.orchestrator import triage_report_pipeline

router = APIRouter()

# Validation constraints per SRS Section 3.5 (NFR-S3) and Section 3.7.2
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    supabase: Optional[Client] = None
    print("WARNING: Supabase URL or Key is missing. Database operations will fail.")
else:
    supabase: Optional[Client] = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=ClientOptions(auto_refresh_token=False, persist_session=False)
    )


@router.post("/")
async def create_report(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    notes: Optional[str] = Form(None),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")

    # 0. Validate input data per SRS constraints (NFR-S3 & FR-03)
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid GPS coordinates: latitude ({latitude}) must be between -90 and 90, longitude ({longitude}) between -180 and 180."
        )

    if notes and len(notes) > 280:
        raise HTTPException(
            status_code=400,
            detail=f"Citizen notes exceed the 280-character maximum limit ({len(notes)} characters provided)."
        )

    content_type = photo.content_type or "image/jpeg"
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format: '{content_type}'. Allowed types are JPEG, PNG, and WebP."
        )

    # 1. Generate tracking reference (e.g. ER-2026-XXXXXX)
    tracking_reference = f"ER-2026-{str(uuid.uuid4().int)[:6]}"

    # 2. Upload photo to Supabase Storage
    try:
        file_bytes = await photo.read()
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum allowed size of 8MB ({len(file_bytes) / (1024 * 1024):.2f}MB uploaded)."
            )
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

        file_ext = photo.filename.split(".")[-1] if photo.filename and "." in photo.filename else "jpg"
        file_name = f"{tracking_reference}.{file_ext}"

        # Upload to canal-photos bucket
        supabase.storage.from_("canal-photos").upload(
            file_name,
            file_bytes,
            {"content-type": content_type}
        )

        # Get public URL
        image_url = supabase.storage.from_("canal-photos").get_public_url(file_name)
    except HTTPException:
        raise
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

        # Associate report with authenticated citizen if available
        if current_user:
            data["reporter_id"] = current_user.id
            log_transaction(f"[{tracking_reference}] Report submitted by authenticated user {current_user.email} (ID: {current_user.id})")
        else:
            log_transaction(f"[{tracking_reference}] Report submitted by guest user")

        db_res = supabase.table("reports").insert(data).execute()
        report_id = db_res.data[0]["report_id"]

        # Trigger Phase 4 Multi-Agent Triage Pipeline in the background
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


@router.get("/{report_id}")
async def get_report_detail(report_id: str):
    """
    SRS Section 3.7.2 & FR-12:
    Retrieves full detail for a single report, including structured agent outputs if available.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")

    try:
        # Fetch report details
        rep_res = supabase.table("reports").select("*").eq("report_id", report_id).execute()
        if not rep_res.data or len(rep_res.data) == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report = rep_res.data[0]

        # Fetch agent results for this report
        agent_res = supabase.table("agent_results").select("*").eq("report_id", report_id).execute()
        
        vision_result = None
        weather_result = None
        for row in (agent_res.data or []):
            if row.get("agent_type") == "vision_triage":
                vision_result = row.get("result_json")
            elif row.get("agent_type") == "meteorological":
                weather_result = row.get("result_json")

        priority_score = float(report["priority_score"]) if report.get("priority_score") is not None else None
        priority_label = None
        if priority_score is not None:
            if priority_score < 30.0:
                priority_label = "Low"
            elif priority_score < 60.0:
                priority_label = "Medium"
            elif priority_score < 80.0:
                priority_label = "High"
            else:
                priority_label = "Urgent"

        return {
            "report_id": report["report_id"],
            "status": report.get("status"),
            "tracking_reference": report.get("tracking_reference"),
            "image_url": report.get("image_url"),
            "latitude": float(report["latitude"]),
            "longitude": float(report["longitude"]),
            "citizen_notes": report.get("citizen_notes"),
            "vision_result": vision_result,
            "weather_result": weather_result,
            "priority_score": priority_score,
            "priority_label": priority_label,
            "needs_human_review": bool(report.get("needs_human_review", False)),
            "created_at": report.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve report: {str(e)}")


@router.get("/{report_id}/agent-log")
async def get_agent_log(
    report_id: str,
    current_user: AuthenticatedUser = Depends(require_admin_or_dispatcher),
):
    """
    4.5 Agent Execution Logging & Transparency Endpoint
    Returns the raw agent outputs for a given report to expose the AI's reasoning.
    Restricted to Admin and Dispatcher personnel.
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
async def update_report_status(
    report_id: str,
    payload: StatusUpdateRequest,
    current_user: AuthenticatedUser = Depends(require_admin_or_dispatcher),
):
    """
    Phase 5.5 Dispatcher Status Transition Controls & Audit Log
    Updates the report status and inserts an audit record into dispatch_status_log.
    Restricted to Admin and Dispatcher personnel.
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

        # 3. Transaction audit logging
        log_transaction(
            f"[{report_id}] Status updated to '{payload.status}' by {current_user.email} (Role: {current_user.role})"
        )

        return {"message": f"Status updated to {payload.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

@router.post("/{report_id}/re-assess")
async def reassess_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(require_admin_or_dispatcher),
):
    """
    Re-run the AI Vision & Multi-Agent Triage Pipeline for a given report.
    Resets status to 'pending_analysis', clears old agent results, and launches
    triage_report_pipeline in the background.
    Restricted to Admin and Dispatcher personnel.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")

    try:
        # 1. Fetch report details
        res = supabase.table("reports").select("*").eq("report_id", report_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report = res.data[0]

        # 2. Clear old agent results to ensure fresh analysis output
        supabase.table("agent_results").delete().eq("report_id", report_id).execute()

        # 3. Reset report status to pending_analysis & clear human review flag
        supabase.table("reports").update({
            "status": "pending_analysis",
            "needs_human_review": False
        }).eq("report_id", report_id).execute()

        # 4. Insert transition into dispatch status log
        supabase.table("dispatch_status_log").insert({
            "report_id": report_id,
            "to_status": "pending_analysis"
        }).execute()

        # 5. Log transaction audit
        log_transaction(
            f"[{report_id}] AI Re-assessment triggered by {current_user.email} (Role: {current_user.role})"
        )

        # 6. Re-run triage pipeline in background
        background_tasks.add_task(
            triage_report_pipeline,
            report_id=report_id,
            image_url=report["image_url"],
            latitude=float(report["latitude"]),
            longitude=float(report["longitude"]),
            citizen_notes=report.get("citizen_notes")
        )

        return {
            "message": "AI triage re-assessment initiated in background",
            "report_id": report_id,
            "status": "pending_analysis"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate re-assessment: {str(e)}")


class ManualTriageRequest(BaseModel):
    blockage_severity_score: float
    waste_categories: List[str] = []
    rationale: Optional[str] = None


@router.post("/{report_id}/manual-triage")
async def manual_triage_report(
    report_id: str,
    payload: ManualTriageRequest,
    current_user: AuthenticatedUser = Depends(require_admin_or_dispatcher),
):
    """
    Allows LGU dispatchers to manually set the canal blockage severity score and waste categories,
    while still automatically synthesizing the final priority score using live weather data from Open-Meteo.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured in backend .env")

    try:
        # 1. Fetch report details
        res = supabase.table("reports").select("*").eq("report_id", report_id).execute()
        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report = res.data[0]
        latitude = float(report["latitude"])
        longitude = float(report["longitude"])

        # 2. Check if weather data already exists for this report in agent_results; if not, query Meteorological Agent
        weather_res = supabase.table("agent_results")\
            .select("*")\
            .eq("report_id", report_id)\
            .eq("agent_type", "meteorological")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        weather_result = None
        if weather_res.data and len(weather_res.data) > 0:
            weather_result = weather_res.data[0].get("result_json")
        
        if not weather_result or weather_result.get("data_unavailable"):
            from api.agents.meteorological import run_meteorological_agent
            weather_result = await run_meteorological_agent(report_id, latitude, longitude)
            if weather_result:
                supabase.table("agent_results").insert({
                    "report_id": report_id,
                    "agent_type": "meteorological",
                    "result_json": weather_result
                }).execute()

        # 3. Construct manual vision result dictionary
        clamped_severity = max(0.0, min(100.0, float(payload.blockage_severity_score)))
        default_rationale = f"Manual triage verified by LGU sanitation officer ({current_user.email}). Blockage Severity: {clamped_severity}%."
        vision_result = {
            "report_id": report_id,
            "is_valid_waterway": True,
            "rejection_reason": None,
            "waste_categories": payload.waste_categories if payload.waste_categories else ["Plastic", "Organic"],
            "blockage_severity_score": clamped_severity,
            "confidence": "high",
            "rationale": payload.rationale or default_rationale,
            "is_manual_override": True,
            "reviewed_by": current_user.email
        }

        # Save/update vision_triage in agent_results
        supabase.table("agent_results").insert({
            "report_id": report_id,
            "agent_type": "vision_triage",
            "result_json": vision_result
        }).execute()

        # 4. Synthesize final Priority Score combining manual severity (60%) and Open-Meteo Rain Index (40%)
        from api.agents.synthesis import run_dispatch_synthesis
        priority_score, priority_label = run_dispatch_synthesis(vision_result, weather_result or {})

        # 5. Update reports table
        supabase.table("reports").update({
            "status": "triaged",
            "priority_score": priority_score,
            "needs_human_review": False
        }).eq("report_id", report_id).execute()

        # 6. Log status change
        supabase.table("dispatch_status_log").insert({
            "report_id": report_id,
            "to_status": "triaged"
        }).execute()

        rpi = weather_result.get("rain_probability_index", 0) if weather_result else 0
        log_transaction(
            f"[{report_id}] Manual Triage by {current_user.email}: Severity {clamped_severity}%, Weather RPI {rpi}% -> Priority Score: {priority_score} ({priority_label})"
        )

        return {
            "message": "Manual triage successfully applied with weather synthesis",
            "report_id": report_id,
            "status": "triaged",
            "blockage_severity_score": clamped_severity,
            "rain_probability_index": rpi,
            "priority_score": priority_score,
            "priority_label": priority_label,
            "vision_result": vision_result,
            "weather_result": weather_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply manual triage: {str(e)}")

