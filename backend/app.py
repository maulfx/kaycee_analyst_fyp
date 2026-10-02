"""
FastAPI Backend for TikTok FYP Radar.
Provides real-time prediction API for Web Dashboard & Chrome Extension.
"""

import sys
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

try:
    from backend.predictor_model import predict_fyp, BENCHMARKS
    from backend.scraper import fetch_tiktok_video_stats
except ImportError:
    from predictor_model import predict_fyp, BENCHMARKS
    from scraper import fetch_tiktok_video_stats

app = FastAPI(
    title="Kaycee_AnalystFYP API",
    description="Real-time TikTok FYP predictive engine & analytics backend",
    version="1.0.0"
)

# Enable CORS for Chrome Extension, local dev, and public web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DASHBOARD_DIR = Path(__file__).resolve().parent.parent / "dashboard"


# â”€â”€â”€ Pydantic Request Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ManualPredictRequest(BaseModel):
    views: int = Field(..., ge=0, description="Current total views")
    likes: int = Field(0, ge=0, description="Total likes")
    reposts: int = Field(0, ge=0, description="Total reposts/shares")
    saves: int = Field(0, ge=0, description="Total bookmarks/saves")
    comments: int = Field(0, ge=0, description="Total comments")
    duration: float = Field(13.0, ge=1.0, description="Video duration in seconds")
    age_hours: float = Field(2.0, ge=0.01, description="Hours elapsed since upload")
    title: Optional[str] = Field("", description="Video title and hashtags")
    track: Optional[str] = Field("", description="Audio track name")


class UrlAnalyzeRequest(BaseModel):
    url: str = Field(..., description="TikTok video URL (tiktok.com/@user/video/... or vt.tiktok.com/...)")


# â”€â”€â”€ API Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "engine": "Kaycee_AnalystFYP v1.0",
        "dataset_baseline": "400 verified videos from top creators",
        "median_benchmarks": BENCHMARKS
    }


@app.get("/api/benchmarks")
async def get_benchmarks():
    """Return benchmark thresholds."""
    return {
        "benchmarks": BENCHMARKS,
        "sweetspot_duration": "12s - 14s",
        "winning_sound_type": "Original Sound (Custom Beat)"
    }


@app.post("/api/predict")
async def predict_from_metrics(payload: ManualPredictRequest):
    """Predict FYP probability from raw engagement numbers (used by Chrome Extension & Simulator)."""
    result = predict_fyp(
        views=payload.views,
        likes=payload.likes,
        reposts=payload.reposts,
        saves=payload.saves,
        comments=payload.comments,
        duration=payload.duration,
        age_hours=payload.age_hours,
        title=payload.title or "",
        track=payload.track or ""
    )
    return result


@app.post("/api/analyze-url")
async def analyze_tiktok_url(payload: UrlAnalyzeRequest):
    """Fetch live data from TikTok URL and return immediate FYP prediction."""
    url = payload.url.strip()
    if not ("tiktok.com" in url):
        raise HTTPException(status_code=400, detail="Invalid TikTok URL. Harus berupa link tiktok.com.")

    scraped = await fetch_tiktok_video_stats(url)
    if not scraped.get("success"):
        raise HTTPException(status_code=422, detail=scraped.get("error", "Failed to fetch video"))

    prediction = predict_fyp(
        views=scraped["views"],
        likes=scraped["likes"],
        reposts=scraped["reposts"],
        saves=scraped["saves"],
        comments=scraped["comments"],
        duration=scraped["duration"],
        age_hours=scraped["age_hours"],
        title=scraped["title"],
        track=scraped["track"]
    )

    return {
        "video_info": {
            "id": scraped["id"],
            "url": scraped["url"],
            "title": scraped["title"],
            "author": scraped["author"],
            "thumbnail": scraped["thumbnail"],
            "track": scraped["track"],
            "duration": scraped["duration"],
            "age_hours": scraped["age_hours"],
        },
        "prediction": prediction
    }


# â”€â”€â”€ Serve Web Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if DASHBOARD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(DASHBOARD_DIR)), name="static")

    @app.get("/")
    async def serve_dashboard():
        index_file = DASHBOARD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Dashboard index.html not found"}


