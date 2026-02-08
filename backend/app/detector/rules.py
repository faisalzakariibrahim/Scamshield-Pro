
import re
from typing import List, Tuple

# Modular Rule Engine: Heuristic signatures for scams
RULES = [
    (r"(?i)(urgent|act now|immediate|action required|suspended|locked|unauthorized)", "Urgency/Pressure tactics", 20),
    (r"(?i)(winner|lottery|prize|gift card|inherited|million|jackpot)", "Suspicious reward promise", 25),
    (r"(?i)(verify your account|update password|login here|confirm details)", "Credential harvesting pattern", 30),
    (r"(?i)(bit\.ly|t\.co|tinyurl\.com|ow\.ly|is\.gd)", "URL shortener (Potential obfuscation)", 10),
    (r"(?i)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", "Raw IP address link", 15)
]

def run_heuristics(text: str) -> Tuple[int, List[str]]:
    score = 0
    indicators = []
    
    for pattern, description, weight in RULES:
        if re.search(pattern, text):
            score += weight
            indicators.append(description)
            
    return min(score, 100), indicators
