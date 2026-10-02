/**
 * TikTok FYP Radar - Frontend Application Logic
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? ''
  : ''; // Relative when served by FastAPI or deployed

// Sample preloaded scenarios from our validated dataset
const SAMPLE_VIDEOS = {
  viral: {
    views: 386700,
    likes: 74300,
    reposts: 5438,
    saves: 17500,
    comments: 240,
    duration: 13,
    age_hours: 4.0,
    title: "adding fatui pngs, more effects, and no loop? | #capitano #genshinimpact",
    track: "original sound - kaycee"
  },
  breakout: {
    views: 341900,
    likes: 65700,
    reposts: 8076,
    saves: 16300,
    comments: 310,
    duration: 14,
    age_hours: 3.5,
    title: "emma x arlecchino | #arlecchino #emmaveil #genshinedit",
    track: "original sound - kaycee"
  },
  flop: {
    views: 2096,
    likes: 300,
    reposts: 18,
    saves: 143,
    comments: 8,
    duration: 14,
    age_hours: 6.0,
    title: "give it up to me | #qingxiao #wutheringwaves",
    track: "stock music"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  checkApiHealth();
  setupUrlScanner();
  setupSampleButtons();
  setupSimulator();
});

// ─── API Health Check ──────────────────────────────────────────
async function checkApiHealth() {
  const dot = document.getElementById('apiStatusDot');
  const label = document.getElementById('apiStatusText');
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 10px #10b981';
      label.textContent = 'Engine Online & Connected';
    } else {
      throw new Error();
    }
  } catch {
    dot.style.background = '#f59e0b';
    dot.style.boxShadow = '0 0 10px #f59e0b';
    label.textContent = 'Engine Offline (Demo Mode)';
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

    btn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Menganalisis...';

    try {
      const res = await fetch(`${API_BASE}/api/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Gagal memproses URL');
      }

      const pred = data.prediction || data;
      const info = data.video_info || { title: data.title || '', author: data.author || '' };
      renderPredictionResult(pred, info);
    } catch (err) {
      alert(`⚠️ Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Analisis Video 🚀';
    }
  });
}

// ─── Sample Buttons Handler ────────────────────────────────────
function setupSampleButtons() {
  document.getElementById('btnSampleViral').addEventListener('click', () => {
    runManualPrediction(SAMPLE_VIDEOS.viral, "Capitano Mega Viral (386.7k views)");
  });

  document.getElementById('btnSampleBreakout').addEventListener('click', () => {
    runManualPrediction(SAMPLE_VIDEOS.breakout, "Emma x Arlecchino (341.9k views)");
  });

  document.getElementById('btnSampleFlop').addEventListener('click', () => {
    runManualPrediction(SAMPLE_VIDEOS.flop, "Qingxiao Flop (<5k views)");
  });
}

async function runManualPrediction(payload, label = "") {
  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const prediction = await res.json();
    renderPredictionResult(prediction, { title: label || payload.title, author: "@kaycee.onw" });
  } catch (err) {
    console.error("Manual predict error:", err);
  }
}

// ─── Render HUD Results ────────────────────────────────────────
function renderPredictionResult(pred, info = {}) {
  if (!pred) return;
  const prob = pred.probability_pct !== undefined ? pred.probability_pct : (pred.score || 0);
  const scoreDisp = document.getElementById('scoreDisplay');
  const tierBadge = document.getElementById('tierBadge');
  const potentialViews = document.getElementById('potentialViewsDisplay');
  const summaryText = document.getElementById('resultSummaryText');
  const circle = document.getElementById('gaugeCircle');

  // Smooth Gauge Animation
  scoreDisp.textContent = `${prob}%`;
  tierBadge.textContent = pred.status_label;
  tierBadge.style.color = pred.badge_color;
  tierBadge.style.borderColor = pred.badge_color;
  tierBadge.style.background = `${pred.badge_color}18`;
  potentialViews.textContent = pred.potential_views;
  potentialViews.style.color = pred.badge_color;

  const ageBadge = (pred.lifecycle && pred.lifecycle.age_label) ? `<div style="margin-top:6px;font-size:0.85em;color:#00f2fe;">⏱️ <strong>Waktu Upload:</strong> ${pred.lifecycle.age_label} &nbsp;|&nbsp; <strong>Fase:</strong> ${pred.lifecycle.badge || ''}</div>` : '';
  summaryText.innerHTML = `<strong>${info.title || info.author || 'Video'}</strong> — ${pred.summary}${ageBadge}`;

  // Circumference: 2 * PI * 82 = ~515.2
  const maxDash = 515.2;
  const offset = maxDash - (prob / 100) * maxDash;
  circle.style.strokeDashoffset = offset;
  circle.style.stroke = pred.badge_color;

  // Conversion Ratios
  const m = pred.metrics;
  updateRatio('valRepost', 'badgeRepost', `${m.repost_rate}%`, m.repost_rate >= 1.5 ? 'EXCELLENT' : 'LOW', m.repost_rate >= 1.5 ? '#10b981' : '#ef4444');
  updateRatio('valSave', 'badgeSave', `${m.save_rate}%`, m.save_rate >= 4.5 ? 'HIGH' : 'NORMAL', m.save_rate >= 4.5 ? '#10b981' : '#f59e0b');
  updateRatio('valLike', 'badgeLike', `${m.like_rate}%`, m.like_rate >= 17 ? 'VERY HIGH' : 'NORMAL', m.like_rate >= 17 ? '#10b981' : '#f59e0b');
  updateRatio('valTotalEr', 'badgeTotalEr', `${m.total_er}%`, m.total_er >= 22 ? 'FYP READY' : 'AVERAGE', m.total_er >= 22 ? '#00f2fe' : '#94a3b8');

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
    li.textContent = rec;
    recList.appendChild(li);
  });

  // Scroll smoothly to results
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateRatio(valId, badgeId, valText, badgeText, color) {
  const vEl = document.getElementById(valId);
  const bEl = document.getElementById(badgeId);
  vEl.textContent = valText;
  vEl.style.color = color;
  bEl.textContent = badgeText;
  bEl.style.color = color;
  bEl.style.borderColor = `${color}40`;
  bEl.style.background = `${color}15`;
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
    document.getElementById('simAgeVal').textContent = `${age} Jam`;

    const totalEr = ((likes + saves + reposts) / views) * 100;
    const velocity = (views / age);
    document.getElementById('simErText').textContent = `${totalEr.toFixed(1)}%`;
    document.getElementById('simVelocityText').textContent = `${(velocity / 1000).toFixed(1)}k / jam`;

    // Local client-side instant prediction preview
    const likeRate = (likes / views) * 100;
    const saveRate = (saves / views) * 100;
    const repostRate = (reposts / views) * 100;

    let durMult = (dur >= 12 && dur <= 14) ? 1.35 : (dur >= 15 && dur <= 18) ? 1.05 : 0.85;
    let score = (likeRate + (repostRate * 4.5) + (saveRate * 2.2)) * durMult;

    // Velocity early boost
    if (age <= 4 && velocity >= 2000) score *= 1.15;

    // Sigmoid
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
      advice.textContent = '🔥 Momentum luar biasa! Video ini memiliki rasio yang identik dengan konten viral 100k - 500k+ views.';
    } else if (probPct >= 55) {
      tierDisplay.textContent = 'FYP BREAKOUT';
      tierDisplay.style.color = '#10b981';
      gaugeCircle.style.borderColor = '#10b981';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)';
      advice.textContent = '📈 Kuat! Video sudah menembus rasio median akun dan siap di-push ke audiens baru.';
    } else if (probPct >= 35) {
      tierDisplay.textContent = 'NORMAL';
      tierDisplay.style.color = '#f59e0b';
      gaugeCircle.style.borderColor = '#f59e0b';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.4)';
      advice.textContent = '🟡 Stabil di angka views rata-rata. Naikkan repost untuk mendorong ke tier breakout.';
    } else {
      tierDisplay.textContent = 'FLOP RISK';
      tierDisplay.style.color = '#ef4444';
      gaugeCircle.style.borderColor = '#ef4444';
      gaugeCircle.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.4)';
      advice.textContent = '🔴 Risiko tertahan di bawah 5.000 views. Engagement awal belum cukup kuat memicu algoritma.';
    }
  };

  [viewsEl, likesEl, savesEl, repostsEl, durEl, ageEl].forEach(slider => {
    slider.addEventListener('input', onSimulate);
  });

  onSimulate();
}
