/**
 * Kaycee_AnalystFYP - Frontend Dashboard Application Logic
 * Supports Real-time Analysis, Interactive Simulator, and Full ID/EN Bilingual Switching.
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? ''
  : ''; // Relative when served by FastAPI or deployed

// ─── Generic Clean Benchmark Scenarios (No specific trial creator references) ───
const SAMPLE_VIDEOS = {
  viral: {
    views: 386700,
    likes: 74300,
    reposts: 5438,
    saves: 17500,
    comments: 240,
    duration: 13,
    age_hours: 4.0,
    title: "Creative Storytelling Edit #trending #viral",
    track: "Original Trending Audio"
  },
  breakout: {
    views: 124500,
    likes: 21800,
    reposts: 2950,
    saves: 6800,
    comments: 140,
    duration: 13.5,
    age_hours: 3.5,
    title: "High Energy Visual Flow #cinematic #fyp",
    track: "Original Beat Mix"
  },
  flop: {
    views: 2800,
    likes: 290,
    reposts: 14,
    saves: 95,
    comments: 12,
    duration: 25,
    age_hours: 8.0,
    title: "Daily Routine & Moments #lifestyle #daily",
    track: "Background Acoustic Track"
  }
};

// ─── Bilingual Dictionary (ID & EN) ───
const I18N = {
  id: {
    nav_sub: "Real-Time Predictive Engine v1.2",
    engine_online: "Engine Online",
    engine_offline: "Engine Offline (Demo Mode)",
    stat_engine_lbl: "System Engine",
    stat_engine_val: "Algoritma FYP v1.2",
    stat_duration_lbl: "Golden Duration",
    stat_er_lbl: "Benchmark ER",
    stat_trigger_lbl: "Top Trigger",
    scan_tag: "Live Scanner",
    scan_title: "Analisis Link Video TikTok Secara Real-Time",
    scan_desc: "Masukkan link video TikTok untuk menarik metrik langsung dan memprediksi momentum FYP-nya.",
    input_placeholder: "https://www.tiktok.com/@username/video/...",
    btn_analyze: "Analisis Video",
    btn_analyzing: "Menganalisis...",
    sample_label: "Coba Contoh Cepat:",
    sample_viral: "Simulasi Mega Viral (350k+)",
    sample_breakout: "Simulasi Breakout (80k+)",
    sample_flop: "Simulasi Flop (<5k)",
    score_eyebrow: "FYP Probability Score",
    tier_waiting: "Menunggu Input",
    reach_lbl: "Estimasi Potensi Jangkauan:",
    diag_eyebrow: "Algorithmic Diagnostic Breakdown",
    diag_summary_waiting: "Kirim link video atau gunakan simulator di bawah untuk melihat rincian diagnosa.",
    ratio_repost_hint: "Ambang FYP: > 1.5%",
    ratio_save_hint: "Ambang FYP: > 4.5%",
    ratio_like_hint: "Ambang FYP: > 18.0%",
    ratio_er_hint: "Median Niche: 21.5%",
    dur_mult_lbl: "Durasi Multiplier:",
    topic_mult_lbl: "Topik / Karakter:",
    audio_mult_lbl: "Audio / Beat:",
    rec_title: "💡 Rekomendasi & Temuan Algoritma:",
    rec_waiting: "Menunggu data video untuk dievaluasi...",
    sim_tag: 'Simulasi "What-If"',
    sim_title: "Interactive Real-Time Score Simulator",
    sim_desc: "Geser nilai statistik di bawah untuk mensimulasikan probabilitas FYP pada video yang baru saja Anda upload.",
    sim_lbl_views: "Total Views",
    sim_lbl_likes: "Likes",
    sim_lbl_saves: "Saves (Favorites)",
    sim_lbl_reposts: "Reposts (Shares) 🔥",
    sim_lbl_duration: "Durasi Video (Detik)",
    sim_lbl_age: "Waktu Sejak Upload (Jam)",
    sim_hud_title: "Simulated FYP Momentum",
    sim_hud_calculated: "Calculated",
    sim_advice_default: "Geser slider di samping untuk melihat dinamika algoritma.",
    footer_text: "© 2026 TikTok FYP Radar Engine • Dedicated Predictive Analytics",
    upload_time_lbl: "Waktu Upload",
    phase_lbl: "Fase Distribusi",
    advice_viral: "🔥 Momentum luar biasa! Video ini memiliki rasio yang identik dengan konten viral 100k - 500k+ views.",
    advice_breakout: "📈 Kuat! Video sudah menembus rasio median akun dan siap didistribusikan ke audiens FYP yang lebih luas.",
    advice_normal: "🟡 Stabil di performa rata-rata. Naikkan rasio share/repost untuk memicu dorongan ke tier breakout.",
    advice_flop: "🔴 Risiko tertahan di bawah 5.000 views. Engagement awal belum cukup kuat untuk memicu algoritma.",
    unit_hour: "Jam",
    unit_velocity: "k / jam",
    err_network: "Gagal memproses URL video. Pastikan link dapat diakses."
  },
  en: {
    nav_sub: "Real-Time Predictive Engine v1.2",
    engine_online: "Engine Online",
    engine_offline: "Engine Offline (Demo Mode)",
    stat_engine_lbl: "System Engine",
    stat_engine_val: "FYP Algorithm v1.2",
    stat_duration_lbl: "Golden Duration",
    stat_er_lbl: "Benchmark ER",
    stat_trigger_lbl: "Top Trigger",
    scan_tag: "Live Scanner",
    scan_title: "Real-Time TikTok Video URL Scanner",
    scan_desc: "Enter a TikTok video link to extract real-time metrics and predict its FYP momentum.",
    input_placeholder: "https://www.tiktok.com/@username/video/...",
    btn_analyze: "Analyze Video",
    btn_analyzing: "Analyzing...",
    sample_label: "Try Quick Scenarios:",
    sample_viral: "Mega Viral Simulation (350k+)",
    sample_breakout: "Breakout Simulation (80k+)",
    sample_flop: "🔴 Flop Risk Simulation (<5k)",
    score_eyebrow: "FYP Probability Score",
    tier_waiting: "Waiting for Input",
    reach_lbl: "Estimated Potential Reach:",
    diag_eyebrow: "Algorithmic Diagnostic Breakdown",
    diag_summary_waiting: "Submit a video link or use the simulator below to view diagnostic breakdown.",
    ratio_repost_hint: "FYP Threshold: > 1.5%",
    ratio_save_hint: "FYP Threshold: > 4.5%",
    ratio_like_hint: "FYP Threshold: > 18.0%",
    ratio_er_hint: "Niche Median: 21.5%",
    dur_mult_lbl: "Duration Multiplier:",
    topic_mult_lbl: "Topic / Subject:",
    audio_mult_lbl: "Audio / Beat:",
    rec_title: "💡 Algorithm Insights & Recommendations:",
    rec_waiting: "Waiting for video data to evaluate...",
    sim_tag: '"What-If" Simulation',
    sim_title: "Interactive Real-Time Score Simulator",
    sim_desc: "Adjust engagement statistics below to simulate FYP probability for your uploaded video.",
    sim_lbl_views: "Total Views",
    sim_lbl_likes: "Likes",
    sim_lbl_saves: "Saves (Favorites)",
    sim_lbl_reposts: "Reposts (Shares) 🔥",
    sim_lbl_duration: "Video Duration (Seconds)",
    sim_lbl_age: "Time Since Upload (Hours)",
    sim_hud_title: "Simulated FYP Momentum",
    sim_hud_calculated: "Calculated",
    sim_advice_default: "Adjust sliders on the left to observe algorithm dynamics.",
    footer_text: "© 2026 TikTok FYP Radar Engine • Dedicated Predictive Analytics",
    upload_time_lbl: "Upload Time",
    phase_lbl: "Distribution Phase",
    advice_viral: "🔥 Outstanding momentum! Ratios strongly align with viral breakout content (100k - 500k+ views).",
    advice_breakout: "📈 Strong performance! Video has crossed median benchmarks and is entering expanded FYP reach.",
    advice_normal: "🟡 Stable baseline performance. Higher repost velocity is needed to trigger wider FYP circulation.",
    advice_flop: "🔴 High risk of stalling below 5,000 views. Early engagement velocity is insufficient.",
    unit_hour: "Hours",
    unit_velocity: "k / hr",
    err_network: "Failed to process video URL. Ensure the link is accessible."
  }
};

let currentLang = localStorage.getItem('kaycee_analyst_lang') || 'id';
let lastPredictionData = null;
let lastVideoInfo = null;

document.addEventListener('DOMContentLoaded', () => {
  setupLanguageSwitcher();
  checkApiHealth();
  setupUrlScanner();
  setupSampleButtons();
  setupSimulator();
  applyLanguage(currentLang);
});

// ─── Language Switcher Logic ────────────────────────────────────
function setupLanguageSwitcher() {
  const btn = document.getElementById('btnLangToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const nextLang = (currentLang === 'id') ? 'en' : 'id';
    applyLanguage(nextLang);
  });
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('kaycee_analyst_lang', lang);
  document.documentElement.lang = lang;

  const t = I18N[lang] || I18N['id'];

  // Update button badge
  const flagEl = document.getElementById('langFlag');
  const codeEl = document.getElementById('langCode');
  if (flagEl) flagEl.textContent = (lang === 'id') ? '🇮🇩' : '🇬🇧';
  if (codeEl) codeEl.textContent = lang.toUpperCase();

  // Update all data-i18n text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Update input placeholder
  const input = document.getElementById('tiktokUrlInput');
  if (input && t.input_placeholder) {
    input.placeholder = t.input_placeholder;
  }

  // Refresh simulator labels
  if (window.refreshSimulatorLabels) {
    window.refreshSimulatorLabels();
  }

  // Refresh last rendered prediction (if any)
  if (lastPredictionData) {
    renderPredictionResult(lastPredictionData, lastVideoInfo);
  }
}

// ─── API Health Check ──────────────────────────────────────────
async function checkApiHealth() {
  const dot = document.getElementById('apiStatusDot');
  const label = document.getElementById('apiStatusText');
  const t = I18N[currentLang] || I18N['id'];

  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 10px #10b981';
      label.textContent = t.engine_online || 'Engine Online';
    } else {
      throw new Error();
    }
  } catch {
    dot.style.background = '#f59e0b';
    dot.style.boxShadow = '0 0 10px #f59e0b';
    label.textContent = t.engine_offline || 'Engine Offline (Demo Mode)';
  }
}

// ─── URL Scanner Handler ───────────────────────────────────────
function setupUrlScanner() {
  const form = document.getElementById('urlAnalyzeForm');
  const input = document.getElementById('tiktokUrlInput');
  const btn = document.getElementById('btnAnalyzeUrl');
  const spinner = document.getElementById('analyzeSpinner');
  const btnText = btn.querySelector('.btn-text');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    const t = I18N[currentLang] || I18N['id'];
    btn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = t.btn_analyzing || 'Menganalisis...';

    try {
      const res = await fetch(`${API_BASE}/api/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || t.err_network);
      }

      lastPredictionData = data.prediction || data;
      lastVideoInfo = data.video_info || { author: data.author, title: '' };
      renderPredictionResult(lastPredictionData, lastVideoInfo);

    } catch (err) {
      alert(err.message || (t.err_network));
    } finally {
      btn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = t.btn_analyze || 'Analisis Video 🚀';
    }
  });
}

// ─── Quick Sample Buttons ──────────────────────────────────────
function setupSampleButtons() {
  document.getElementById('btnSampleViral').addEventListener('click', () => {
    runSampleScenario(SAMPLE_VIDEOS.viral);
  });
  document.getElementById('btnSampleBreakout').addEventListener('click', () => {
    runSampleScenario(SAMPLE_VIDEOS.breakout);
  });
  document.getElementById('btnSampleFlop').addEventListener('click', () => {
    runSampleScenario(SAMPLE_VIDEOS.flop);
  });
}

async function runSampleScenario(scenario) {
  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    if (res.ok) {
      const data = await res.json();
      lastPredictionData = data;
      lastVideoInfo = { title: scenario.title, author: 'Simulation Model' };
      renderPredictionResult(data, lastVideoInfo);
    }
  } catch (err) {
    console.error("Sample predict error:", err);
  }
}

// ─── Render HUD Results ────────────────────────────────────────
function renderPredictionResult(pred, info = {}) {
  if (!pred) return;
  const t = I18N[currentLang] || I18N['id'];
  const prob = pred.probability_pct !== undefined ? pred.probability_pct : (pred.score || 0);
  const scoreDisp = document.getElementById('scoreDisplay');
  const tierBadge = document.getElementById('tierBadge');
  const potentialViews = document.getElementById('potentialViewsDisplay');
  const summaryText = document.getElementById('resultSummaryText');
  const circle = document.getElementById('gaugeCircle');

  // Status Tier Translation
  let statusText = pred.status_label || (prob >= 75 ? "MEGA FYP" : "NORMAL");
  if (currentLang === 'en') {
    if (prob >= 75) statusText = "MEGA FYP";
    else if (prob >= 50) statusText = "FYP BREAKOUT";
    else if (prob >= 35) statusText = "BASELINE / AVERAGE";
    else statusText = "FLOP RISK";
  }

  scoreDisp.textContent = `${prob}%`;
  tierBadge.textContent = statusText;
  tierBadge.style.color = pred.badge_color;
  tierBadge.style.borderColor = pred.badge_color;
  tierBadge.style.background = `${pred.badge_color}18`;

  let viewsStr = pred.potential_views || "-";
  if (currentLang === 'en' && viewsStr.includes('tayangan')) {
    viewsStr = viewsStr.replace(/tayangan/gi, 'Views');
  }
  potentialViews.textContent = viewsStr;
  potentialViews.style.color = pred.badge_color;

  // Time & Phase Info
  let ageBadge = '';
  if (pred.lifecycle && pred.lifecycle.age_label) {
    let ageStr = pred.lifecycle.age_label;
    let phaseStr = pred.lifecycle.badge || pred.lifecycle.phase || '';

    if (currentLang === 'en') {
      const h = pred.lifecycle.age_hours;
      if (h !== undefined && h !== null) {
        if (h < 1.0) ageStr = `${Math.max(Math.round(h * 60), 1)} mins ago`;
        else if (h < 24.0) ageStr = `${h.toFixed(1)} hours ago`;
        else if (h < 168.0) ageStr = `${(h / 24.0).toFixed(1)} days ago`;
        else ageStr = `${Math.round(h / 168.0)} weeks ago`;
      }
      if (phaseStr.includes('MATURE') || phaseStr.includes('Mature')) phaseStr = "📊 Mature Distribution";
      else if (phaseStr.includes('CONFIRMED') || phaseStr.includes('Viral')) phaseStr = "🏆 Confirmed Viral";
      else if (phaseStr.includes('EXPANDED') || phaseStr.includes('Breakout')) phaseStr = "📈 Expanded Reach";
      else if (phaseStr.includes('TESTING') || phaseStr.includes('Initial')) phaseStr = "⚡ Initial Batch";
    }

    ageBadge = `<div style="margin-top:6px;font-size:0.85em;color:#00f2fe;">⏱️ <strong>${t.upload_time_lbl}:</strong> ${ageStr} &nbsp;|&nbsp; <strong>${t.phase_lbl}:</strong> ${phaseStr}</div>`;
  }

  let summaryContent = pred.summary || '';
  if (currentLang === 'en') {
    if (prob >= 75) {
      summaryContent = "Outstanding viral velocity! Engagement ratios align with top-tier viral content (" + viewsStr + ").";
    } else if (prob >= 50) {
      summaryContent = "Strong breakout trajectory. Metrics exceed median benchmarks and are entering wider FYP distribution.";
    } else if (prob >= 35) {
      summaryContent = "Baseline performance. Meets regular follower expectations; higher repost velocity is needed for broader distribution.";
    } else {
      summaryContent = "Early engagement momentum is weak. High risk of stalling below 5,000 views.";
    }
  }

  summaryText.innerHTML = `<strong>${info.title || info.author || 'Video'}</strong> — ${summaryContent}${ageBadge}`;

  // Gauge animation
  const maxDash = 515.2;
  const offset = maxDash - (prob / 100) * maxDash;
  circle.style.strokeDashoffset = offset;
  circle.style.stroke = pred.badge_color;

  // Conversion Ratios
  const m = pred.metrics;
  updateRatio('valRepost', 'badgeRepost', `${m.repost_rate}%`, m.repost_rate >= 1.5 ? (currentLang === 'en' ? 'EXCELLENT' : 'BAGUS') : (currentLang === 'en' ? 'LOW' : 'RENDAH'), m.repost_rate >= 1.5 ? '#10b981' : '#ef4444');
  updateRatio('valSave', 'badgeSave', `${m.save_rate}%`, m.save_rate >= 4.5 ? (currentLang === 'en' ? 'HIGH' : 'TINGGI') : (currentLang === 'en' ? 'NORMAL' : 'STANDAR'), m.save_rate >= 4.5 ? '#10b981' : '#f59e0b');
  updateRatio('valLike', 'badgeLike', `${m.like_rate}%`, m.like_rate >= 17 ? (currentLang === 'en' ? 'VERY HIGH' : 'SANGAT TINGGI') : (currentLang === 'en' ? 'NORMAL' : 'STANDAR'), m.like_rate >= 17 ? '#10b981' : '#f59e0b');
  updateRatio('valTotalEr', 'badgeTotalEr', `${m.total_er}%`, m.total_er >= 22 ? (currentLang === 'en' ? 'FYP READY' : 'SIAP FYP') : (currentLang === 'en' ? 'AVERAGE' : 'RATA-RATA'), m.total_er >= 22 ? '#00f2fe' : '#94a3b8');

  // Multipliers
  const mults = pred.multipliers;
  document.getElementById('durMultVal').textContent = `${mults.duration_multiplier}x`;
  document.getElementById('topicMultVal').textContent = `${mults.topic_multiplier}x`;
  document.getElementById('audioMultVal').textContent = `${mults.audio_multiplier}x`;

  // Recommendations
  const recList = document.getElementById('recommendationList');
  recList.innerHTML = '';
  pred.recommendations.forEach(rec => {
    const li = document.createElement('li');
    let recText = rec;
    if (currentLang === 'en') {
      if (rec.includes('Evaluasi Umur')) recText = rec.replace('Evaluasi Umur', 'Lifecycle Stage');
      if (rec.includes('Rasio Repost rendah')) recText = "🔁 Repost rate is below recommended FYP threshold (> 1.2% needed).";
      if (rec.includes('Rasio Simpan rendah')) recText = "🔖 Save rate is low. High saves signal valuable replayability to the algorithm.";
      if (rec.includes('Perfect Loop Sweet Spot')) recText = "🎯 Perfect Loop Sweet Spot (12-14s): +35% Boost to retention and repeat views.";
      if (rec.includes('Topik Standar')) recText = "Neutral topic momentum.";
      if (rec.includes('Audio Standar')) recText = "Standard audio background.";
    }
    li.textContent = recText;
    recList.appendChild(li);
  });

  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateRatio(valId, badgeId, valText, badgeText, color) {
  const vEl = document.getElementById(valId);
  const bEl = document.getElementById(badgeId);
  if (vEl) {
    vEl.textContent = valText;
    vEl.style.color = color;
  }
  if (bEl) {
    bEl.textContent = badgeText;
    bEl.style.color = color;
    bEl.style.borderColor = `${color}40`;
    bEl.style.background = `${color}15`;
  }
}

// ─── Real-Time Simulator ───────────────────────────────────────
function setupSimulator() {
  const viewsEl = document.getElementById('simViews');
  const likesEl = document.getElementById('simLikes');
  const savesEl = document.getElementById('simSaves');
  const repostsEl = document.getElementById('simReposts');
  const durEl = document.getElementById('simDuration');
  const ageEl = document.getElementById('simAge');

  const onSimulate = () => {
    const t = I18N[currentLang] || I18N['id'];
    const views = parseInt(viewsEl.value);
    const likes = parseInt(likesEl.value);
    const saves = parseInt(savesEl.value);
    const reposts = parseInt(repostsEl.value);
    const dur = parseFloat(durEl.value);
    const age = parseFloat(ageEl.value);

    // Update labels
    document.getElementById('simViewsVal').textContent = views.toLocaleString();
    document.getElementById('simLikesVal').textContent = `${likes.toLocaleString()} (${((likes / views) * 100).toFixed(1)}%)`;
    document.getElementById('simSavesVal').textContent = `${saves.toLocaleString()} (${((saves / views) * 100).toFixed(1)}%)`;
    document.getElementById('simRepostsVal').textContent = `${reposts.toLocaleString()} (${((reposts / views) * 100).toFixed(1)}%)`;
    document.getElementById('simDurationVal').textContent = `${dur}s`;
    document.getElementById('simAgeVal').textContent = `${age} ${t.unit_hour || 'Jam'}`;

    const totalEr = ((likes + saves + reposts) / views) * 100;
    const velocity = (views / age);
    document.getElementById('simErText').textContent = `${totalEr.toFixed(1)}%`;
    document.getElementById('simVelocityText').textContent = `${(velocity / 1000).toFixed(1)} ${t.unit_velocity || 'k / jam'}`;

    // Formula calculation
    const likeRate = (likes / views) * 100;
    const saveRate = (saves / views) * 100;
    const repostRate = (reposts / views) * 100;

    let durMult = (dur >= 12 && dur <= 14) ? 1.35 : (dur >= 15 && dur <= 18) ? 1.05 : 0.85;
    let score = (likeRate + (repostRate * 4.5) + (saveRate * 2.2)) * durMult;

    if (age <= 4 && velocity >= 2000) score *= 1.15;

    let prob = 1.0 / (1.0 + Math.exp(-0.12 * (score - 28.5)));
    let probPct = Math.min(Math.max(Math.round(prob * 100), 1), 99);

    const scoreDisplay = document.getElementById('simScoreDisplay');
    const tierDisplay = document.getElementById('simTierDisplay');
    const gaugeCircle = document.getElementById('simGaugeDisplay');
    const advice = document.getElementById('simAdviceText');

    scoreDisplay.textContent = `${probPct}%`;

    if (probPct >= 75) {
      tierDisplay.textContent = 'MEGA FYP';
      tierDisplay.style.color = '#00f2fe';
      gaugeCircle.style.borderColor = '#00f2fe';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(0, 242, 254, 0.4)';
      advice.textContent = t.advice_viral;
    } else if (probPct >= 55) {
      tierDisplay.textContent = currentLang === 'en' ? 'FYP BREAKOUT' : 'FYP BREAKOUT';
      tierDisplay.style.color = '#10b981';
      gaugeCircle.style.borderColor = '#10b981';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)';
      advice.textContent = t.advice_breakout;
    } else if (probPct >= 35) {
      tierDisplay.textContent = currentLang === 'en' ? 'BASELINE / AVERAGE' : 'NORMAL';
      tierDisplay.style.color = '#f59e0b';
      gaugeCircle.style.borderColor = '#f59e0b';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.4)';
      advice.textContent = t.advice_normal;
    } else {
      tierDisplay.textContent = currentLang === 'en' ? 'FLOP RISK' : 'RISIKO FLOP';
      tierDisplay.style.color = '#ef4444';
      gaugeCircle.style.borderColor = '#ef4444';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.4)';
      advice.textContent = t.advice_flop;
    }
  };

  [viewsEl, likesEl, savesEl, repostsEl, durEl, ageEl].forEach(slider => {
    slider.addEventListener('input', onSimulate);
  });

  window.refreshSimulatorLabels = onSimulate;
  onSimulate();
}
