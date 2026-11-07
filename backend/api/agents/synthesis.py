from typing import Dict, Any, Tuple

# Configuration Constants per SRS Section 3.6.2 (NFR-M2)
# Severity is weighted more heavily (60%) because it is directly observed,
# while rain probability (40%) acts as a forward-looking urgency multiplier.
VISION_WEIGHT: float = 0.60
RAIN_WEIGHT: float = 0.40


def run_dispatch_synthesis(vision_result: Dict[str, Any], weather_result: Dict[str, Any]) -> Tuple[float, str]:
    """
    Fuses the results from the Vision Triage Agent and the Meteorological Agent.
    Computes a Priority Score and assigns a Priority Label.
    
    Formula: (VISION_WEIGHT * Blockage_Severity_Score) + (RAIN_WEIGHT * Rain_Probability_Index)
    Fallback: When weather data is unavailable, falls back to severity-only score.
    
    Returns: (priority_score, priority_label)
    """
    raw_severity = vision_result.get("blockage_severity_score", 0.0) if vision_result else 0.0
    try:
        blockage_severity_score = float(raw_severity)
    except (ValueError, TypeError):
        blockage_severity_score = 0.0
    
    # Check if weather data is unavailable or None
    rain_probability_index = weather_result.get("rain_probability_index") if weather_result else None
    is_weather_unavailable = bool(weather_result.get("data_unavailable", False)) if weather_result else True

    if is_weather_unavailable or rain_probability_index is None:
        # Severity-only fallback (per SRS 3.3.2 fail-safe mechanism)
        priority_score = blockage_severity_score
    else:
        try:
            rpi = float(rain_probability_index)
        except (ValueError, TypeError):
            rpi = 0.0
        # Weighted synthesis: 60% Vision Severity, 40% Rain Probability
        priority_score = (VISION_WEIGHT * blockage_severity_score) + (RAIN_WEIGHT * rpi)

    # Determine Priority Label per SRS thresholds:
    # 0–29.9 = Low, 30–59.9 = Medium, 60–79.9 = High, 80–100 = Urgent
    if priority_score < 30.0:
        priority_label = "Low"
    elif priority_score < 60.0:
        priority_label = "Medium"
    elif priority_score < 80.0:
        priority_label = "High"
    else:
        priority_label = "Urgent"

    # Format to 2 decimal places
    priority_score = round(priority_score, 2)

    return priority_score, priority_label
