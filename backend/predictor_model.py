"""
TikTok FYP Prediction Engine.
Based on empirical statistical models derived from 400+ videos across 
top gacha/anime edit creators (@kaycee.onw, @dwrena, @reinwi, @hyutaoo).
"""

import math
from typing import Dict, Any, List

# Benchmarks learned from the 400-video dataset
BENCHMARKS = {
    "median_er": 21.5,
    "median_like_rate": 16.0,
    "median_save_rate": 4.2,
    "median_repost_rate": 1.12,
    "breakout_repost_rate": 1.8,
    "viral_repost_rate": 3.0,
    "breakout_er": 23.0,
}

HYPE_TOPICS = [
    "arlecchino", "capitano", "columbina", "dottore", "pantalone", "sandrone",
    "fatui", "raiden", "ei", "furina", "hutao", "evernight", "stelle",
    "aventurine", "firefly", "yaoguang", "rhinedottir", "endfield", "chen qianyu",
    "thypon", "laevatain", "x "  # crossover format indicator
]

LOW_TRAFFIC_TOPICS = [
    "qingxiao", "lifemakeover", "suo"
]


def calculate_duration_multiplier(duration: float) -> tuple[float, str]:
    """Calculate duration bonus multiplier based on loop retention dynamics."""
    if duration <= 0:
        return 1.0, "Unknown duration"
    if 12.0 <= duration <= 14.9:
        return 1.35, "🎯 Perfect Loop Sweet Spot (12-14s): +35% Boost to retention and repeat plays"
    elif 15.0 <= duration <= 17.9:
        return 1.05, "✅ Good Duration (15-17s): Normal algorithm pacing"
    elif 9.0 <= duration < 12.0:
        return 0.85, "⚠️ Fast Paced (<12s): Watch time volume is slightly lower"
    elif 18.0 <= duration <= 25.0:
        return 0.90, "⚠️ Moderate Length (18-25s): Requires stronger early hook to avoid drop-off"
    else:
        return 0.75, "⛔ Long Video (>25s): Drop-off risk is high for anime/gaming edit niche"


def calculate_topic_multiplier(title_and_tags: str) -> tuple[float, str]:
    """Calculate topic / character interest multiplier."""
    text = (title_and_tags or "").lower()
    
    # Check for crossover
    if " x " in text or " vs " in text or " x" in text:
        return 1.25, "🔥 High-Engagement Crossover Format: Strong curiosity hook (+25% boost)"

    for topic in HYPE_TOPICS:
        if topic in text:
            return 1.20, f"⭐ High-Demand Subject ({topic.capitalize()}): Algorithmic interest is high (+20% boost)"

    for low in LOW_TRAFFIC_TOPICS:
        if low in text:
            return 0.80, f"⚠️ Niche Subject ({low.capitalize()}): Statistically higher flop rate in historic dataset (-20%)"

    return 1.0, "Standard Subject: Neutral topic momentum"


def calculate_audio_multiplier(track_name: str) -> tuple[float, str]:
    """Calculate sound type multiplier."""
    track_lower = (track_name or "").lower()
    if any(k in track_lower for k in ["original sound", "suara asli", "оригинальный звук"]):
        return 1.15, "🎵 Custom Original Beat: Higher edit synchronization and loop rewatches (+15% boost)"
    return 1.0, "Standard Audio Track"


def predict_fyp(
    views: int,
    likes: int,
    reposts: int,
    saves: int,
    comments: int,
    duration: float = 13.0,
    age_hours: float = 2.0,
    title: str = "",
    track: str = ""
) -> Dict[str, Any]:
    """
    Predict real-time FYP likelihood and viral momentum.
    """
    views = max(int(views or 0), 1)
    likes = int(likes or 0)
    reposts = int(reposts or 0)
    saves = int(saves or 0)
    comments = int(comments or 0)
    duration = float(duration or 13.0)
    age_hours = max(float(age_hours or 0.1), 0.05)

    # Core conversion rates
    like_rate = (likes / views) * 100.0
    save_rate = (saves / views) * 100.0
    repost_rate = (reposts / views) * 100.0
    comment_rate = (comments / views) * 100.0
    total_engagement = likes + saves + reposts + comments
    engagement_rate = (total_engagement / views) * 100.0

    # Views velocity (views per hour)
    velocity_vph = views / age_hours

    # Multipliers
    dur_mult, dur_note = calculate_duration_multiplier(duration)
    topic_mult, topic_note = calculate_topic_multiplier(title)
    audio_mult, audio_note = calculate_audio_multiplier(track)

    # Base Weighted Score
    # Repost has highest weight (4x), Save has 2x, Like has 1x, Comment has 0.5x
    # A standard FYP breakout requires Repost > 1.5%, Save > 4.5%, Like > 16%
    raw_weighted = (like_rate * 1.0) + (repost_rate * 4.5) + (save_rate * 2.2) + (comment_rate * 0.5)

    # Apply contextual multipliers
    final_score = raw_weighted * dur_mult * topic_mult * audio_mult

    # Velocity adjustment (bonus for high velocity in early hours)
    if age_hours <= 4.0:
        if velocity_vph >= 5000:
            final_score *= 1.20
        elif velocity_vph >= 1500:
            final_score *= 1.10
        elif velocity_vph < 200:
            final_score *= 0.85

    # Convert to 0 - 100% Probability using sigmoid normalization centered around breakout benchmark
    # Benchmark score for normal FYP is ~30.0
    # Sigmoid: P = 1 / (1 + exp(-k * (score - 30)))
    k = 0.12
    prob = 1.0 / (1.0 + math.exp(-k * (final_score - 28.5)))
    probability_pct = round(min(max(prob * 100.0, 1.0), 99.0), 1)

    # Classification Tier
    if probability_pct >= 75.0:
        status = "MEGA_FYP"
        status_label = "🚀 Mega Viral FYP Incoming"
        potential_views = "100,000 - 1,000,000+ Views"
        badge_color = "#00f2fe"
        summary = "Metrik luar biasa! Rasio Repost dan Save berada di top 10% ekosistem. Algoritma saat ini memprioritaskan video ini untuk dorongan masif."
    elif probability_pct >= 55.0:
        status = "BREAKOUT_FYP"
        status_label = "📈 FYP Breakout Phase"
        potential_views = "30,000 - 100,000 Views"
        badge_color = "#10b981"
        summary = "Sinyal sangat positif! Rasio engagement melampaui batas median akun dan siap menembus batas penonton baru."
    elif probability_pct >= 35.0:
        status = "AVERAGE"
        status_label = "🟡 Baseline / Average"
        potential_views = "8,000 - 25,000 Views"
        badge_color = "#f59e0b"
        summary = "Performa video stabil di batas rata-rata akun. Butuh dorongan repost tambahan untuk menembus FYP luas."
    else:
        status = "FLOP_RISK"
        status_label = "🔴 Tertahan / Flop Risk"
        potential_views = "< 5,000 Views"
        badge_color = "#ef4444"
        summary = "Rasio engagement awal (khususnya Repost & Save) belum memenuhi ambang batas dorongan algoritma."

    # Actionable diagnostic recommendations
    recommendations = []
    if repost_rate < 1.0:
        recommendations.append("🔄 Rasio Repost rendah (<1.0%). Tambahkan ajakan/call-to-action untuk repost di pinned comment atau teks akhir video.")
    else:
        recommendations.append(f"🔥 Rasio Repost sangat bagus ({repost_rate:.2f}%)! Ini pemicu utama video Anda disebarkan ke FYP teman pengguna.")

    if save_rate < 3.5:
        recommendations.append("🔖 Rasio Simpan/Save rendah (<3.5%). Gunakan transisi atau beat sound yang menarik untuk disimpan sebagai referensi audio.")
    else:
        recommendations.append(f"✨ Rasio Save kuat ({save_rate:.2f}%). Video dianggap bernilai tinggi oleh audiens.")

    if 12.0 <= duration <= 14.9:
        recommendations.append("⏱️ Durasi 12-14s berada tepat di golden sweet spot! Watch completion rate akan sangat optimal.")
    elif duration > 20.0:
        recommendations.append("⏱️ Durasi cukup panjang (>20s). Pertimbangkan memadatkan transisi menjadi 13-14 detik untuk upload selanjutnya.")

    recommendations.append(topic_note)
    recommendations.append(audio_note)

    return {
        "probability_pct": probability_pct,
        "status": status,
        "status_label": status_label,
        "potential_views": potential_views,
        "badge_color": badge_color,
        "summary": summary,
        "metrics": {
            "views": views,
            "likes": likes,
            "saves": saves,
            "reposts": reposts,
            "comments": comments,
            "like_rate": round(like_rate, 2),
            "save_rate": round(save_rate, 2),
            "repost_rate": round(repost_rate, 2),
            "comment_rate": round(comment_rate, 2),
            "total_er": round(engagement_rate, 2),
            "velocity_vph": round(velocity_vph, 1),
            "duration": duration,
            "age_hours": round(age_hours, 1)
        },
        "multipliers": {
            "duration_multiplier": dur_mult,
            "topic_multiplier": topic_mult,
            "audio_multiplier": audio_mult,
            "final_weighted_score": round(final_score, 2)
        },
        "recommendations": recommendations
    }
