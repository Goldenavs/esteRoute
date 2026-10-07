from typing import Dict, Any, Tuple

def run_dispatch_synthesis(vision_result: Dict[str, Any], weather_result: Dict[str, Any]) -> Tuple[float, str]:
    """
    Fuses the results from the Vision Triage Agent and the Meteorological Agent.
    Computes a Priority Score and assigns a Priority Label.
    
    Returns: (priority_score, priority_label)
    """
    
    blockage_severity_score = vision_result.get("blockage_severity_score", 0.0)
    
    # Check if weather data is unavailable
    if weather_result and weather_result.get("data_unavailable", False):
        # Severity-only fallback
        priority_score = float(blockage_severity_score)
    elif weather_result:
        rain_probability_index = weather_result.get("rain_probability_index", 0.0)
        # Weighted formula: 60% Vision Severity, 40% Rain Probability
        priority_score = (0.6 * float(blockage_severity_score)) + (0.4 * float(rain_probability_index))
    else:
        priority_score = float(blockage_severity_score)

    # Determine Priority Label
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
