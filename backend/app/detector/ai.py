
import os
import json
import google.generativeai as genai
from typing import Dict, Any
import bleach

# Initialize with environment variable
API_KEY = os.getenv("API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

async def analyze_with_ai(content: str, is_image: bool = False, deep_scan: bool = False) -> Dict[str, Any]:
    """Sandboxed AI analysis using Gemini. Output is treated as untrusted."""
    model_name = 'gemini-3-flash-preview' if not deep_scan else 'gemini-3-pro-preview'
    if is_image:
        model_name = 'gemini-2.5-flash-image'
        
    model = genai.GenerativeModel(model_name)
    
    prompt = """
    Perform a forensic security audit on the provided message. 
    Identify phishing, financial scams, or social engineering.
    Output ONLY valid JSON with keys: verdict (safe, suspicious, scam), risk_score (0-100), reasoning, advice, indicators (array).
    """

    try:
        if is_image:
            # content is already re-encoded base64
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": content}
            ])
        else:
            response = model.generate_content(f"{prompt}\n\nINPUT: {content}")

        # Treat AI output as untrusted payload
        raw_text = response.text
        clean_json = re.sub(r'```json\n?|```', '', raw_text).strip()
        data = json.loads(clean_json)
        
        # Sanitize AI strings before returning to client
        data['reasoning'] = bleach.clean(data.get('reasoning', ''), tags=[], strip=True)
        data['advice'] = bleach.clean(data.get('advice', ''), tags=[], strip=True)
        data['indicators'] = [bleach.clean(i, tags=[], strip=True) for i in data.get('indicators', [])]
        
        return data
    except Exception as e:
        print(f"AI_ANALYSIS_ERROR|{str(e)}")
        return {
            "verdict": "suspicious",
            "risk_score": 50,
            "reasoning": "Deep analysis could not be completed securely.",
            "advice": "Review manually and do not trust links.",
            "indicators": ["AI Module Timeout"]
        }
