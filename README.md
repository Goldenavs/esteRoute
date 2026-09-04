# esteRoute

**An Autonomous Multi-Agent Triage and Dispatch Platform for Urban Drainage Blockage Mitigation**

esteRoute is an AI-assisted, web-based decision-support platform designed to address urban flash flooding by optimizing the clearing of obstructed *esteros* (urban canals). By utilizing a multi-agent artificial intelligence pipeline, it converts unranked citizen complaints into a dynamically prioritized, weather-aware dispatch queue for Local Government Unit (LGU) sanitation teams.

## Features

- **Citizen Reporter Portal:** A lightweight, mobile-responsive web interface allowing citizens to submit geotagged photographic reports of canal blockages without needing an account.
- **Vision Triage Agent:** Automatically classifies the severity of the blockage and identifies waste categories (e.g., plastics, silt) using Google Gemini 1.5 Flash multimodal AI.
- **Meteorological Agent:** Cross-references incident locations with 48-hour precipitation forecasts (via Open-Meteo) to quantify immediate flood risk.
- **Dispatch Synthesis Engine:** Computes a composite **Priority Score** combining blockage severity and incoming rain probability, ensuring critical obstructions are cleared *before* heavy rains.
- **LGU Dispatcher Dashboard:** A command center for sanitation officers featuring an interactive map (React Leaflet) and a real-time, sortable priority queue to manage crew dispatches.

## Tech Stack

**Frontend (Client Tier)**
- React + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- React Leaflet (Mapping)

**Backend (Application Tier)**
- Python 3.10+ & FastAPI
- Uvicorn (Local Execution)
- Google Generative AI (Gemini 1.5 Flash)
- Open-Meteo API
- Pydantic (Schema Validation)

**Database (Data Tier)**
- Supabase (PostgreSQL)
- Supabase Storage (Photo hosting)

## System Architecture

esteRoute uses a three-tier architecture with an embedded asynchronous agentic orchestration layer. 
1. The **Citizen** submits a report.
2. The **Vision Triage Agent** and **Meteorological Agent** process the image and location concurrently.
3. The **Synthesis Engine** calculates the final priority score and saves it to the database.
4. The **LGU Dispatcher** views the updated queue on the dashboard.

## Getting Started

This project is separated into a `frontend` and `backend` directory.

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- A Supabase account (Free Tier)
- A Google Gemini API Key

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```
*Note: Ensure you create a `.env` file in the backend directory with your Supabase and Gemini credentials before running the server.*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev