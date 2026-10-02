"""
FastAPI Backend for TikTok FYP Radar.
Provides real-time prediction API for Web Dashboard & Chrome Extension.
All analysis, batch lifecycle logic, and upload time calculations are processed centrally here on the server.
"""

import sys
import os
import re
import time
import json
import logging
import asyncio
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

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

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kaycee_AnalystFYP API",
    description="Real-time TikTok FYP predictive engine & analytics backend",
    version="1.2.0"
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


def resolve_short_url(url: str) -> str:
    """Resolve short links like vt.tiktok.com or /t/ to full canonical URL."""
    if "vt.tiktok.com" in url or "vm.tiktok.com" in url or "/t/" in url:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.geturl()
        except Exception as e:
            logger.warning(f"Could not resolve short URL {url}: {e}")
    return url


def decode_snowflake_timestamp(video_id_str: str) -> dict:
    """
    Decodes the absolute upload timestamp from TikTok's 64-bit Snowflake Video ID.
    The first 32 bits of any 19-digit TikTok ID is the Unix Epoch Timestamp in seconds.
    Calculates exact age in hours and formats date in Indonesian Western Time (WIB / UTC+7).
    """
    try:
        if video_id_str and video_id_str.isdigit():
            big_int_id = int(video_id_str)
            timestamp_sec = big_int_id >> 32
            
            # Validasi rentang timestamp wajar (2018 - 2030)
            if 1514764800 < timestamp_sec < 1900000000:
                now_sec = int(time.time())
                diff_sec = max(now_sec - timestamp_sec, 0)
                age_hours = max(diff_sec / 3600.0, 0.01)
                
                if age_hours < 1.0:
                    mins = max(round(age_hours * 60), 1)
                    age_label = f"{mins} Menit Lalu"
                elif age_hours < 24.0:
                    age_label = f"{age_hours:.1f} Jam Lalu"
                elif age_hours < 168.0:
                    days = age_hours / 24.0
                    age_label = f"{days:.1f} Hari Lalu"
                else:
                    weeks = round(age_hours / 168.0)
                    age_label = f"{weeks} Minggu Lalu"

                # Gunakan WIB (UTC+7) sesuai zona waktu Indonesia
                wib_tz = timezone(timedelta(hours=7))
                upload_dt = datetime.fromtimestamp(timestamp_sec, tz=wib_tz)
                date_str = upload_dt.strftime("%d %b %Y, %H:%M WIB")

                return {
                    "timestamp": timestamp_sec,
                    "age_hours": round(age_hours, 2),
                    "age_label": f"{age_label} ({date_str})",
                    "date_str": date_str,
                    "relative_label": age_label
                }
    except Exception as e:
        logger.warning(f"Error decoding Snowflake ID {video_id_str}: {e}")

    return {
        "timestamp": 0,
        "age_hours": 2.0,
        "age_label": "2.0 Jam Lalu",
        "date_str": "",
        "relative_label": "2.0 Jam Lalu"
    }


# ─── Pydantic Request Models ──────────────────────────────────────────────────
class ManualPredictRequest(BaseModel):
    views: int = Field(..., ge=0, description="Current total views")
    likes: int = Field(0, ge=0, description="Total likes")
    reposts: int = Field(0, ge=0, description="Total reposts/shares")
    saves: int = Field(0, ge=0, description="Total bookmarks/saves")
    comments: int = Field(0, ge=0, description="Total comments")
    duration: Optional[float] = Field(13.0, description="Video duration in seconds")
    duration_sec: Optional[float] = Field(None)
    age_hours: Optional[float] = Field(2.0, description="Hours elapsed since upload")
    hours_since_upload: Optional[float] = Field(None)
    title: Optional[str] = Field("", description="Video title and hashtags")
    track: Optional[str] = Field("", description="Audio track name")


class UrlAnalyzeRequest(BaseModel):
    url: str = Field(..., description="TikTok video URL (tiktok.com/@user/video/... or vt.tiktok.com/...)")
    client_views: Optional[int] = None
    client_likes: Optional[int] = None
    client_comments: Optional[int] = None
    client_saves: Optional[int] = None
    client_reposts: Optional[int] = None
    client_author: Optional[str] = None
    client_title: Optional[str] = None


# ─── API Routes ───────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "engine": "Kaycee_AnalystFYP v1.2",
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
    """Predict FYP probability from raw engagement numbers (used by Simulator)."""
    effective_dur = payload.duration_sec if payload.duration_sec is not None else (payload.duration or 13.0)
    effective_age = payload.hours_since_upload if payload.hours_since_upload is not None else (payload.age_hours or 2.0)
    result = predict_fyp(
        views=payload.views,
        likes=payload.likes,
        reposts=payload.reposts,
        saves=payload.saves,
        comments=payload.comments,
        duration=effective_dur,
        age_hours=effective_age,
        title=payload.title or "",
        track=payload.track or ""
    )
    return result


@app.post("/api/analyze-url")
async def analyze_tiktok_url(payload: UrlAnalyzeRequest):
    """
    Centralized Analysis Endpoint for Chrome Extension (Kaycee_Uploud) and Live URL Scanner.
    Extracts the Video ID from the raw URL, calculates the exact upload time via Snowflake timestamp on the server,
    evaluates the TikTok multi-batch distribution lifecycle, and returns the complete verdict.
    """
    raw_url = payload.url.strip()
    if not ("tiktok.com" in raw_url):
        raise HTTPException(status_code=400, detail="Invalid TikTok URL. Harus berupa link tiktok.com.")

    url = resolve_short_url(raw_url)

    # 1. Ekstraksi Video ID dari URL (19 digit diawali angka 7)
    id_match = re.search(r'\b(7\d{18})\b', url)
    video_id = id_match.group(1) if id_match else ""

    # 2. Ekstraksi Username / Author dari URL
    author_match = re.search(r'@([\w.-]+)', url)
    author = ("@" + author_match.group(1)) if author_match else (payload.client_author or "@tiktok_video")

    # 3. Hitung WAKTU UPLOAD & UMUR VIDEO secara mutlak di server via Snowflake ID
    time_info = decode_snowflake_timestamp(video_id)
    server_age_hours = time_info["age_hours"]
    server_age_label = time_info["age_label"]

    # 4. Ambil Metrik Interaksi Video
    views = payload.client_views or 0
    likes = payload.client_likes or 0
    comments = payload.client_comments or 0
    saves = payload.client_saves or 0
    reposts = payload.client_reposts or 0
    duration = 13.0
    title = payload.client_title or ""
    track = ""

    # Coba scrape detail via scraper di server jika ada
    try:
        scraped = await fetch_tiktok_video_stats(url)
        if scraped and scraped.get("success"):
            if scraped.get("views"): views = scraped["views"]
            if scraped.get("likes"): likes = scraped["likes"]
            if scraped.get("comments"): comments = scraped["comments"]
            if scraped.get("saves"): saves = scraped["saves"]
            if scraped.get("reposts"): reposts = scraped["reposts"]
            if scraped.get("duration"): duration = scraped["duration"]
            if scraped.get("title"): title = scraped["title"]
            if scraped.get("track"): track = scraped["track"]
            if scraped.get("author"): author = scraped["author"]
            if scraped.get("age_hours") and not video_id:
                server_age_hours = scraped["age_hours"]
    except Exception as e:
        logger.info(f"Scraper notice: {e}")

    # Jika views belum terdeteksi tapi ada likes
    if views <= 0 and likes > 0:
        views = round(likes / 0.156)
    if views <= 0:
        views = 1000

    # 5. Jalankan Machine Learning & Evaluasi Batch Lifecycle 100% di Server
    prediction = predict_fyp(
        views=views,
        likes=likes,
        reposts=reposts,
        saves=saves,
        comments=comments,
        duration=duration,
        age_hours=server_age_hours,
        title=title,
        track=track
    )

    # Pastikan lifecycle umur menggunakan kalkulasi waktu server yang akurat
    prediction["lifecycle"]["age_hours"] = server_age_hours
    prediction["lifecycle"]["age_label"] = server_age_label

    # 6. Kemas hasil final untuk langsung ditampilkan oleh Ekstensi
    return {
        "success": True,
        "prediction": prediction,
        "probability_pct": prediction["probability_pct"],
        "status": prediction["status"],
        "status_label": prediction["status_label"],
        "potential_views": prediction["potential_views"],
        "badge_color": prediction["badge_color"],
        "summary": prediction["summary"],
        "author": author,
        "video_id": video_id,
        "lifecycle": {
            "age_hours": server_age_hours,
            "age_label": server_age_label,
            "phase": prediction["lifecycle"]["phase"],
            "badge": prediction["lifecycle"]["badge"],
            "description": prediction["lifecycle"]["description"],
            "velocity_vph": prediction["lifecycle"]["velocity_vph"],
            "multiplier": prediction["lifecycle"]["multiplier"]
        },
        "metrics": prediction["metrics"],
        "multipliers": prediction["multipliers"],
        "recommendations": prediction["recommendations"],
        "video_info": {
            "id": video_id,
            "url": url,
            "author": author,
            "title": title,
            "upload_time": time_info.get("date_str", "")
        }
    }


# ─── Serve Web Dashboard ──────────────────────────────────────────────────────
if DASHBOARD_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(DASHBOARD_DIR)), name="static")

    @app.get("/")
    async def serve_dashboard():
        index_file = DASHBOARD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Kaycee_AnalystFYP Backend is running"}
