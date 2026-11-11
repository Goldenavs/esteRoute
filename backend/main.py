import os
import sys
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is always on sys.path and load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
load_dotenv()

from api.auth import AuthenticatedUser, require_admin_or_dispatcher, get_optional_user
from api.routers import reports

app = FastAPI(title="esteRoute API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Since it's a demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router, prefix="/api/reports", tags=["reports"])


@app.get("/api/health")
def health_check():
    # Liveness & dependency check per SRS Section 3.7.2
    supabase_configured = bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    gemini_configured = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "supabase_connected": supabase_configured,
        "gemini_reachable": gemini_configured,
        "message": "esteRoute API is running"
    }


@app.get("/api/queue")
def get_dispatch_queue(
    status: Optional[str] = None,
    min_priority: Optional[float] = None,
    sort: Optional[str] = "priority_desc",
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    SRS Section 3.7.2 & FR-08:
    Returns list of triaged reports for dispatcher view.
    Query parameters:
    - status: Optional filter (e.g. triaged, in_progress, resolved)
    - min_priority: Optional minimum priority score filter (float)
    - sort: Sort order (priority_desc [default], date_asc, date_desc)
    """
    if not reports.supabase:
        raise HTTPException(status_code=500, detail="Supabase is not configured on the backend")

    # In production mode, require admin or dispatcher; in demo mode allow transparent inspection
    is_demo = os.environ.get("DEMO_MODE", "false").lower() in ("true", "1")
    if not is_demo and (not current_user or current_user.role not in ["admin", "dispatcher"]):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Admin or Dispatcher privileges required to access dispatch queue."
        )

    try:
        query = reports.supabase.table("reports").select(
            "report_id, tracking_reference, priority_score, status, latitude, longitude, citizen_notes, needs_human_review, created_at"
        )
        if status:
            query = query.eq("status", status)
        if min_priority is not None:
            query = query.gte("priority_score", min_priority)

        # Apply sorting
        if sort == "priority_desc":
            query = query.order("priority_score", desc=True)
        elif sort == "date_asc":
            query = query.order("created_at", desc=False)
        elif sort == "date_desc":
            query = query.order("created_at", desc=True)
        else:
            query = query.order("priority_score", desc=True)

        res = query.execute()
        rows = res.data or []

        # Format output items with priority_label per SRS Section 3.7.2
        results = []
        for r in rows:
            score = float(r["priority_score"]) if r.get("priority_score") is not None else None
            p_label = "Unassigned"
            if score is not None:
                if score < 30.0:
                    p_label = "Low"
                elif score < 60.0:
                    p_label = "Medium"
                elif score < 80.0:
                    p_label = "High"
                else:
                    p_label = "Urgent"

            results.append({
                "report_id": r["report_id"],
                "tracking_reference": r.get("tracking_reference"),
                "priority_score": score,
                "priority_label": p_label,
                "status": r.get("status"),
                "latitude": float(r["latitude"]) if r.get("latitude") is not None else None,
                "longitude": float(r["longitude"]) if r.get("longitude") is not None else None,
                "citizen_notes": r.get("citizen_notes"),
                "needs_human_review": bool(r.get("needs_human_review", False)),
                "created_at": r.get("created_at")
            })

        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch queue: {str(e)}")


@app.get("/api/logs")
def get_logs(current_user: AuthenticatedUser = Depends(require_admin_or_dispatcher)):
    """
    Returns the most recent system transaction logs.
    Restricted to Admin and Dispatcher personnel.
    """
    log_file = os.path.join(os.path.dirname(__file__), "agent_transactions.log")
    if not os.path.exists(log_file):
        return {"logs": ""}
    with open(log_file, "r") as f:
        # Return last 150 lines
        lines = f.readlines()
        return {"logs": "".join(lines[-150:])}
