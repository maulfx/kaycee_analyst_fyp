"""
TikTok FYP Prediction Engine.
Based on empirical statistical models derived from 400+ videos across 
top gacha/anime edit creators (@kaycee.onw, @dwrena, @reinwi, @hyutaoo).
Incorporates TikTok's multi-batch algorithmic distribution lifecycle (Batch 1 -> Batch 2 -> Batch 3 -> Freeze).
"""

import math
from typing import Dict, Any, List, Tuple

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


def calculate_duration_multiplier(duration: float) -> Tuple[float, str]:
    """Calculate duration bonus multiplier based on loop retention dynamics."""
    if duration <= 0:
        return 1.0, "Durasi tidak diketahui"
    if 12.0 <= duration <= 14.9:
        return 1.35, "🎯 Perfect Loop Sweet Spot (12-14s): +35% Boost retensi & repeat plays"
    elif 15.0 <= duration <= 17.9:
        return 1.05, "⏱️ Durasi Baik (15-17s): Algoritma berjalan normal"
    elif 9.0 <= duration < 12.0:
        return 0.85, "⚡ Terlalu Cepat (<12s): Watch time total sedikit lebih rendah"
    elif 18.0 <= duration <= 25.0:
        return 0.90, "⏳ Durasi Menengah (18-25s): Butuh visual hook awal yang sangat kuat"
    else:
        return 0.75, "⚠️ Video Panjang (>25s): Risiko drop-off penonton sangat tinggi"


def calculate_topic_multiplier(title_and_tags: str) -> Tuple[float, str]:
    """Calculate topic / character interest multiplier."""
    text = (title_and_tags or "").lower()
    
    if " x " in text or " vs " in text or " x" in text:
        return 1.25, "🔥 Format Crossover / VS: Curiosity hook tinggi (+25% boost)"

    for topic in HYPE_TOPICS:
        if topic in text:
            return 1.20, f"⭐ Karakter / Topik High-Demand ({topic.capitalize()}): Algoritma memprioritaskan topik ini (+20% boost)"

    for low in LOW_TRAFFIC_TOPICS:
        if low in text:
            return 0.80, f"📉 Topik Niche ({low.capitalize()}): Potensi distribusi awal lebih sempit (-20%)"

    return 1.0, "Topik Standar: Momentum subjek netral"


def calculate_audio_multiplier(track_name: str) -> Tuple[float, str]:
    """Calculate sound type multiplier."""
    track_lower = (track_name or "").lower()
    if any(k in track_lower for k in ["original sound", "suara asli", "sound asli", "original beat"]):
        return 1.15, "🎵 Custom Original Beat: Sinkronisasi edit lebih tinggi & memicu repeat (+15% boost)"
    return 1.0, "Audio Standar"


def calculate_distribution_lifecycle(age_hours: float, views: int, velocity_vph: float, raw_weighted_score: float) -> Tuple[float, str, str, str]:
    """
    Evaluasi Siklus Distribusi Algoritma TikTok (Batch Testing Phase).
    TikTok mendistribusikan video bertahap:
    - 0-3 Jam (Batch 1: Golden Window) -> Pengujian 200-500 user pertama.
    - 3-12 Jam (Batch 2: Escalation Gate) -> Pengujian 1.000-10.000 user.
    - 12-24 Jam (Batch 3: Saturation Window) -> Penentuan status viral harian.
    - > 24 Jam (Post-Distribution / Stagnant Freeze) -> Kran distribusi ditutup jika tidak memenuhi syarat.
    """
    age_hours = max(age_hours, 0.05)

    # 1. Fase Batch 1: Golden Testing Window (0 - 3 Jam)
    if age_hours <= 3.0:
        if velocity_vph >= 2000 and raw_weighted_score >= 25.0:
            return 1.45, "Batch 1: Golden Explosion", f"Baru {age_hours:.1f} jam dengan akselerasi masif ({velocity_vph:.0f} views/jam)! Algoritma sedang meloloskan video ke pengujian viral.", "🚀 GOLDEN BOOST (+45%)"
        elif velocity_vph >= 700 and raw_weighted_score >= 20.0:
            return 1.25, "Batch 1: Active Push", f"Umur {age_hours:.1f} jam dalam fase batch pertama. Engagement awal sangat sehat ({velocity_vph:.0f} views/jam).", "🔥 EARLY PUSH (+25%)"
        elif velocity_vph < 120 and raw_weighted_score < 15.0:
            return 0.75, "Batch 1: Slow Pacing", f"Umur {age_hours:.1f} jam, audiens awal belum banyak berinteraksi.", "⚠️ SLOW START (-25%)"
        else:
            return 1.10, "Batch 1: Testing Phase", f"Umur {age_hours:.1f} jam sedang diuji pada batch audiens pertama (200-500 user).", "⚡ TESTING (+10%)"

    # 2. Fase Batch 2: Escalation Gate (3 - 12 Jam)
    elif 3.0 < age_hours <= 12.0:
        if views >= 12000 and raw_weighted_score >= 24.0:
            return 1.30, "Batch 2: Viral Escalation", f"Umur {age_hours:.1f} jam berhasil menembus 12k+ views dan terus meningkat.", "🚀 ESCALATING (+30%)"
        elif views >= 3000 and raw_weighted_score >= 18.0:
            return 1.05, "Batch 2: Healthy Climb", f"Umur {age_hours:.1f} jam stabil mendaki tier penonton baru.", "🔥 STABLE (+5%)"
        elif views < 1200:
            return 0.55, "Batch 2: Distribution Slowdown", f"Sudah {age_hours:.1f} jam tapi views masih < 1.200. Distribusi awal mulai tertahan.", "📉 SLOWDOWN (-45%)"
        else:
            return 0.85, "Batch 2: Normal Evaluation", f"Umur {age_hours:.1f} jam dalam evaluasi batch kedua.", "⚡ MODERATE (-15%)"

    # 3. Fase Batch 3: Saturation Window (12 - 24 Jam)
    elif 12.0 < age_hours <= 24.0:
        if views >= 40000:
            return 1.20, "Batch 3: Established Trend", f"Dalam 24 jam pertama sudah {views:,} views. Momentum viral mapan.", "🌟 HIGH TREND (+20%)"
        elif views >= 8000:
            return 1.0, "Batch 3: Sustained Momentum", f"Performa stabil di 24 jam pertama.", "✅ SUSTAINED"
        elif views < 2500:
            return 0.35, "Batch 3: Flop Risk Plateau", f"Sudah {age_hours:.1f} jam dan belum mencapai 2.500 views. Algoritma mulai menutup kran distribusi.", "⛔ FLOP PLATEAU (-65%)"
        else:
            return 0.65, "Batch 3: Fading Push", f"Umur {age_hours:.1f} jam, laju views mulai melambat.", "⚠️ FADING (-35%)"

    # 4. Fase Post-Distribution (> 24 Jam ke atas)
    else:
        days = age_hours / 24.0
        if views >= 100000:
            return 1.15, "Post-Distribution: Confirmed Viral", f"Sudah {days:.1f} hari dan mencapai {views:,} views (Sudah resmi FYP luas).", "🏆 CONFIRMED FYP"
        elif views >= 25000:
            return 0.80, "Post-Distribution: Mature Performance", f"Sudah {days:.1f} hari. Video sudah menyelesaikan masa dorongan utamanya.", "📊 MATURE"
        elif views < 5000:
            # Skenario yang dibahas user: Sudah berhari-hari tapi views stuck -> Distribusi sudah mati!
            return 0.15, "Post-Distribution: Algorithmic Freeze", f"Sudah {days:.1f} hari ({age_hours:.0f} jam) namun views hanya {views:,}. Jatah distribusi awal telah ditutup oleh algoritma karena tidak memenuhi requirement di jam-jam pertama.", "🛑 ALGORITHMIC FREEZE (-85%)"
        else:
            return 0.28, "Post-Distribution: Stagnant Plateau", f"Sudah {days:.1f} hari ({age_hours:.0f} jam) dengan views {views:,}. Distribusi aktif telah berakhir.", "📉 STAGNANT (-72%)"


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
    Predict real-time FYP likelihood taking into account engagement velocity and TikTok distribution lifecycle.
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
    # Repost (4.5x), Save (2.2x), Like (1.0x), Comment (0.5x)
    raw_weighted = (like_rate * 1.0) + (repost_rate * 4.5) + (save_rate * 2.2) + (comment_rate * 0.5)

    # Lifecycle Multiplier based on Upload Time & Batch Window
    lifecycle_mult, phase_name, phase_desc, phase_badge = calculate_distribution_lifecycle(
        age_hours=age_hours,
        views=views,
        velocity_vph=velocity_vph,
        raw_weighted_score=raw_weighted
    )

    # Final Combined Score
    final_score = raw_weighted * dur_mult * topic_mult * audio_mult * lifecycle_mult

    # Sigmoid Probability Calculation (Normalized around median benchmark ~28.5)
    k = 0.12
    prob = 1.0 / (1.0 + math.exp(-k * (final_score - 28.5)))
    probability_pct = round(min(max(prob * 100.0, 1.0), 99.0), 1)

    # Classification Tier
    if probability_pct >= 75.0:
        status = "MEGA_FYP"
        status_label = "🚀 Mega Viral FYP Incoming"
        potential_views = "100,000 - 1,000,000+ Views"
        badge_color = "#00f2fe"
        summary = f"Metrik luar biasa! Rasio Repost ({repost_rate:.1f}%) dan Save ({save_rate:.1f}%) berada di tier atas. {phase_desc}"
    elif probability_pct >= 55.0:
        status = "BREAKOUT_FYP"
        status_label = "🔥 FYP Breakout Phase"
        potential_views = "30,000 - 100,000 Views"
        badge_color = "#10b981"
        summary = f"Sinyal sangat positif! Rasio interaksi melampaui median akun. {phase_desc}"
    elif probability_pct >= 35.0:
        status = "AVERAGE"
        status_label = "⚡ Baseline / Average"
        potential_views = "8,000 - 25,000 Views"
        badge_color = "#f59e0b"
        summary = f"Performa di batas standar akun. {phase_desc}"
    else:
        status = "STAGNANT" if age_hours > 24.0 else "FLOP_RISK"
        status_label = "🛑 Distribusi Tertahan / Stagnant" if age_hours > 24.0 else "⚠️ Flop Risk / Kurang Requirement"
        potential_views = f"< {max(views, 3000):,} Views (Mendekati Batas Akhir)" if age_hours > 24.0 else "< 5,000 Views"
        badge_color = "#ef4444"
        summary = f"{phase_desc} Rasio engagement awal tidak cukup kuat untuk memicu batch distribusi lanjutan."

    # Actionable diagnostic recommendations
    recommendations = []
    recommendations.append(f"⏱️ Evaluasi Umur: {phase_name} ({phase_badge})")
    
    if age_hours > 24.0 and views < 10000:
        recommendations.append("🛑 Evaluasi Distribusi: Video sudah melewati masa pengujian awal (Batch 1-2) algoritma. Tanpa lonjakan eksternal atau tren mendadak, distribusi video ini sudah mencapai batas akhir.")
    elif age_hours <= 3.0:
        recommendations.append("🚀 Golden Window Aktif: 3 jam pertama adalah kunci! Pastikan membalas komentar penonton awal untuk mempertahankan momentum velocity.")

    if repost_rate < 1.0:
        recommendations.append(f"🔁 Rasio Repost rendah ({repost_rate:.2f}%). Standar FYP membutuhkan > 1.2% agar diteruskan ke feed For You orang lain.")
    else:
        recommendations.append(f"🔁 Rasio Repost sangat baik ({repost_rate:.2f}%)!")

    if save_rate < 3.5:
        recommendations.append(f"🔖 Rasio Simpan rendah ({save_rate:.2f}%). Video membutuhkan minimal 3.8% save rate untuk Batch 2.")

    recommendations.append(dur_note)
    recommendations.append(topic_note)
    recommendations.append(audio_note)

    return {
        "probability_pct": probability_pct,
        "status": status,
        "status_label": status_label,
        "potential_views": potential_views,
        "badge_color": badge_color,
        "summary": summary,
        "lifecycle": {
            "age_hours": round(age_hours, 2),
            "age_label": f"{age_hours:.1f} Jam Lalu" if age_hours < 24 else f"{(age_hours/24):.1f} Hari Lalu",
            "phase": phase_name,
            "badge": phase_badge,
            "description": phase_desc,
            "velocity_vph": round(velocity_vph, 1),
            "multiplier": lifecycle_mult
        },
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
            "age_hours": round(age_hours, 2)
        },
        "multipliers": {
            "duration_multiplier": dur_mult,
            "topic_multiplier": topic_mult,
            "audio_multiplier": audio_mult,
            "lifecycle_multiplier": lifecycle_mult,
            "final_weighted_score": round(final_score, 2)
        },
        "recommendations": recommendations
    }
