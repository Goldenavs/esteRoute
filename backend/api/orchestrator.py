import asyncio
import os
from supabase import create_client, Client
from api.agents.vision_triage import run_vision_triage
from api.agents.meteorological import run_meteorological_agent
from api.agents.synthesis import run_dispatch_synthesis

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None

async def triage_report_pipeline(report_id: str, image_url: str, latitude: float, longitude: float, citizen_notes: str = None):
    """
    4.4 Agent Orchestrator: In-Process Asynchronous Pipeline Sequencing
    Orchestrates the Vision Agent, Meteorological Agent, and Dispatch Synthesis Engine.
    """
    if not supabase:
        print("Orchestrator aborted: No Supabase client configured.")
        return

    print(f"[{report_id}] Starting AI Triage Pipeline...")

    # Step 1: Vision Triage Agent
    vision_result = await run_vision_triage(report_id, image_url, citizen_notes)
    
    if not vision_result:
        print(f"[{report_id}] Vision Agent failed. Setting manual review.")
        supabase.table("reports").update({
            "status": "failed_analysis",
            "needs_human_review": True
        }).eq("report_id", report_id).execute()
        
        supabase.table("dispatch_status_log").insert({
            "report_id": report_id,
            "to_status": "failed_analysis"
        }).execute()
        return

    # Persist Vision Agent result
    supabase.table("agent_results").insert({
        "report_id": report_id,
        "agent_type": "vision_triage",
        "result_json": vision_result
    }).execute()
    print(f"[{report_id}] Vision Triage completed.")

    # Step 2: Meteorological Agent
    weather_result = await run_meteorological_agent(report_id, latitude, longitude)
    
    if weather_result:
        supabase.table("agent_results").insert({
            "report_id": report_id,
            "agent_type": "meteorological",
            "result_json": weather_result
        }).execute()
        print(f"[{report_id}] Meteorological Triage completed.")

    # Step 3: Dispatch Synthesis Engine
    priority_score, priority_label = run_dispatch_synthesis(vision_result, weather_result)
    
    # Flag for human review if Gemini was unconfident
    needs_review = (vision_result.get("confidence", "high").lower() == "low")

    # Step 4: Final update to database
    supabase.table("reports").update({
        "status": "triaged",
        "priority_score": priority_score,
        "needs_human_review": needs_review
    }).eq("report_id", report_id).execute()

    supabase.table("dispatch_status_log").insert({
        "report_id": report_id,
        "to_status": "triaged"
    }).execute()

    print(f"[{report_id}] Triage Pipeline Complete. Priority: {priority_label} (Score: {priority_score})")
