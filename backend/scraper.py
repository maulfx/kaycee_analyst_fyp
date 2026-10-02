"""
TikTok Real-time Metadata Scraper.
Extracts live stats (views, likes, saves, reposts, comments, duration, timestamp)
from any TikTok video URL using yt-dlp.
"""

import json
import asyncio
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


async def fetch_tiktok_video_stats(video_url: str) -> dict:
    """
    Fetch real-time stats for a TikTok video URL.
    Returns parsed dictionary with live engagement metrics.
    """
    cmd = [
        "yt-dlp",
        "--dump-json",
        "--no-playlist",
        "--skip-download",
        "--ignore-errors",
        "--no-warnings",
        video_url
    ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)

        if process.returncode != 0 or not stdout:
            err_msg = stderr.decode('utf-8', errors='replace')
            logger.warning(f"yt-dlp failed: {err_msg}")
            return {"success": False, "error": "Gagal mengambil data video. Pastikan link video valid dan publik."}

        data = json.loads(stdout.decode('utf-8', errors='replace').strip())

        views = data.get("view_count", 0) or 0
        likes = data.get("like_count", 0) or 0
        saves = data.get("save_count", 0) or 0
        reposts = data.get("repost_count", 0) or 0
        comments = data.get("comment_count", 0) or 0
        duration = data.get("duration", 0) or 0
        title = data.get("title", "") or data.get("description", "") or ""
        timestamp = data.get("timestamp", 0) or 0
        track = data.get("track", "") or ""
        author = data.get("uploader", "") or data.get("channel", "") or ""
        thumbnail = data.get("thumbnail", "") or ""

        now_ts = time.time()
        age_hours = max((now_ts - timestamp) / 3600.0, 0.1) if timestamp else 1.0

        return {
            "success": True,
            "id": data.get("id"),
            "url": video_url,
            "title": title,
            "author": author,
            "thumbnail": thumbnail,
            "duration": duration,
            "timestamp": timestamp,
            "age_hours": round(age_hours, 2),
            "views": views,
            "likes": likes,
            "saves": saves,
            "reposts": reposts,
            "comments": comments,
            "track": track
        }
    except asyncio.TimeoutError:
        return {"success": False, "error": "Request timed out saat memproses video TikTok."}
    except Exception as e:
        logger.error(f"Error scraping video stats: {e}")
        return {"success": False, "error": str(e)}
