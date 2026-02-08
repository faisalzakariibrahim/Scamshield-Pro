
import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.app.api.scan import router as scan_router

# Core Security Architecture: Fail-Safe Defaults
app = FastAPI(title="ScamShield Pro Kernel API", version="4.4.0")

# Rate Limiting: Prevent DoS/Abuse
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: Strict Zero-Trust boundaries
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to specific domain
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Global Fail-Closed Handler: Any internal error returns "suspicious"
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log timestamp and verdict only, no sensitive data
    print(f"CRITICAL_FAULT|{int(time.time())}|VERDICT:suspicious")
    return {
        "verdict": "suspicious",
        "risk_score": 50,
        "reasoning": "Internal security guard failure. Audit could not be completed securely.",
        "advice": "Treat this content as untrusted until the system is restored.",
        "indicators": ["System Fault"],
        "sources": []
    }

app.include_router(scan_router, prefix="/api/v1")
