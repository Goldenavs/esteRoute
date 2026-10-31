import os
import sys
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is always on sys.path and load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(dotenv_path=env_file)
load_dotenv()

from api.auth import AuthenticatedUser, require_admin_or_dispatcher
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
    return {"status": "ok", "message": "esteRoute API is running"}


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
