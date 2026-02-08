
from pydantic import BaseModel, Field, HttpUrl, validator
from typing import List, Optional

class GroundingSource(BaseModel):
    title: str = Field(..., max_length=100)
    url: HttpUrl

class ScanResponse(BaseModel):
    verdict: str
    risk_score: int = Field(ge=0, le=100)
    reasoning: str
    advice: str
    indicators: List[str]
    sources: List[GroundingSource]

    @validator('verdict')
    def validate_verdict(cls, v):
        if v.lower() not in ['safe', 'suspicious', 'scam']:
            return 'suspicious'
        return v.lower()

class ScanRequest(BaseModel):
    text: Optional[str] = Field(None, max_length=5000)
    deep_scan: bool = False
