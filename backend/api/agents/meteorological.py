import httpx
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

async def run_meteorological_agent(report_id: str, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Calls the Open-Meteo API to retrieve the 48-hour forecast and computes
    the Rain Probability Index (RPI) and expected precipitation.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "precipitation_probability,precipitation",
        "forecast_days": 2,
        "timezone": "Asia/Manila"
    }

    max_retries = 2
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=10.0)
                resp.raise_for_status()
                data = resp.json()

            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            precip_probs = hourly.get("precipitation_probability", [])
            precips = hourly.get("precipitation", [])

            if not times or not precip_probs:
                raise ValueError("Invalid Open-Meteo response structure")

            # Calculate metrics across the 48-hour window
            rain_probability_index = max(precip_probs)
            expected_total_precipitation_mm = sum(precips)
            
            # Find the peak rain hour
            peak_idx = precip_probs.index(rain_probability_index)
            peak_rain_hour = times[peak_idx]

            return {
                "report_id": report_id,
                "rain_probability_index": rain_probability_index,
                "expected_total_precipitation_mm": expected_total_precipitation_mm,
                "peak_rain_hour": peak_rain_hour,
                "data_unavailable": False
            }

        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Meteorological Agent failed after {max_retries} attempts: {str(e)}")
                return {
                    "report_id": report_id,
                    "rain_probability_index": None,
                    "expected_total_precipitation_mm": None,
                    "peak_rain_hour": None,
                    "data_unavailable": True
                }
            await asyncio.sleep(2) # 2s backoff

    return None
