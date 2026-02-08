
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.models.schemas import ScanResponse, GroundingSource
from backend.app.security.sanitize import sanitize_text
from backend.app.security.images import process_image_securely
from backend.app.detector.rules import run_heuristics
from backend.app.detector.ai import analyze_with_ai
import base64
from typing import Optional

router = APIRouter()

@router.post("/scan", response_model=ScanResponse)
async def scan_payload(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    deep_scan: bool = Form(False)
):
    # 1. Payload Size Enforcement
    if text and len(text) > 5000:
        raise HTTPException(status_code=413, detail="Payload too large")

    verdict_data = {
        "verdict": "safe",
        "risk_score": 0,
        "reasoning": "",
        "advice": "",
        "indicators": [],
        "sources": []
    }

    try:
        # 2. Process Inputs (Sanitize/Re-encode)
        processed_content = ""
        is_image_scan = False
        
        if image:
            content = await image.read()
            b64_img = base64.b64encode(content).decode('utf-8')
            processed_content = process_image_securely(b64_img)
            is_image_scan = True
        elif text:
            processed_content = sanitize_text(text)
        else:
            return verdict_data

        # 3. Heuristic Rules (Fast check)
        if not is_image_scan:
            h_score, h_indicators = run_heuristics(processed_content)
            verdict_data["risk_score"] = h_score
            verdict_data["indicators"].extend(h_indicators)

        # 4. AI Deep Analysis
        ai_result = await analyze_with_ai(processed_content, is_image_scan, deep_scan)
        
        # Merge results - take the more conservative (higher risk) score
        verdict_data["verdict"] = ai_result.get("verdict", "suspicious")
        verdict_data["risk_score"] = max(verdict_data["risk_score"], ai_result.get("risk_score", 0))
        verdict_data["reasoning"] = ai_result.get("reasoning", "Analysis complete.")
        verdict_data["advice"] = ai_result.get("advice", "Standard precautions apply.")
        verdict_data["indicators"] = list(set(verdict_data["indicators"] + ai_result.get("indicators", [])))

        return verdict_data

    except Exception as e:
        # Fail-closed behavior
        return {
            "verdict": "suspicious",
            "risk_score": 50,
            "reasoning": "A security boundary was triggered during analysis.",
            "advice": "Treat this content as untrusted.",
            "indicators": ["Kernel Exception"],
            "sources": []
        }
