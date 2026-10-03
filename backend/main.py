import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import reports

app = FastAPI(title="esteRoute API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "esteRoute API is running"}
