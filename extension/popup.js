const API_BASE = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  checkBackend();
  setupScanButton();
  setupManualCalc();
});

async function checkBackend() {
  const dot = document.getElementById("statusDot");
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: "GET" });
    if (res.ok) {
      dot.className = "status-dot online";
      dot.title = "Backend Online (http://localhost:8000)";
    } else {
      throw new Error();
    }
  } catch {
    dot.className = "status-dot offline";
    dot.title = "Backend Offline (Gunakan start.bat di folder backend)";
  }
}

function setupScanButton() {
  const btn = document.getElementById("btnScanTab");
  const feedback = document.getElementById("scanFeedback");

  btn.addEventListener("click", async () => {
    feedback.textContent = "Mengekstrak data dari halaman TikTok...";
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes("tiktok.com")) {
        feedback.textContent = "⚠️ Buka video TikTok di tab aktif terlebih dahulu.";
        return;
      }

      // Execute DOM extraction script on active TikTok tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractTikTokDomStats
      });

      const stats = results && results[0] ? results[0].result : null;

      if (!stats) {
        feedback.textContent = "Tidak dapat menemukan data video di halaman ini.";
        return;
      }

      feedback.textContent = `Video terdeteksi: ${stats.likes.toLocaleString()} likes, ${stats.saves.toLocaleString()} saves.`;
      
      // Calculate or predict
      await predictStats(stats);
    } catch (err) {
      feedback.textContent = `Error: ${err.message}`;
    }
  });
}

// Function executed inside the TikTok page context
function extractTikTokDomStats() {
  const parseNum = (str) => {
    if (!str) return 0;
    str = str.trim().toUpperCase();
    if (str.includes('K')) return parseFloat(str.replace('K', '')) * 1000;
    if (str.includes('M')) return parseFloat(str.replace('M', '')) * 1000000;
    if (str.includes('B')) return parseFloat(str.replace('B', '')) * 1000000000;
    return parseInt(str.replace(/,/g, '')) || 0;
  };

  // Selectors for TikTok web video action buttons
  let likes = 0, comments = 0, saves = 0, shares = 0;

  const likeEl = document.querySelector('[data-e2e="like-count"]') || document.querySelector('button[aria-label*="like"] strong');
  const commentEl = document.querySelector('[data-e2e="comment-count"]') || document.querySelector('button[aria-label*="comment"] strong');
  const saveEl = document.querySelector('[data-e2e="undefined-count"]') || document.querySelector('button[aria-label*="favorite"] strong') || document.querySelector('button[aria-label*="bookmark"] strong');
  const shareEl = document.querySelector('[data-e2e="share-count"]') || document.querySelector('button[aria-label*="share"] strong');

  if (likeEl) likes = parseNum(likeEl.textContent);
  if (commentEl) comments = parseNum(commentEl.textContent);
  if (saveEl) saves = parseNum(saveEl.textContent);
  if (shareEl) shares = parseNum(shareEl.textContent);

  // In TikTok web player, views are usually 6x - 7x likes on median
  const estViews = likes > 0 ? Math.round(likes * 6.5) : 5000;

  // Title / Caption
  const captionEl = document.querySelector('[data-e2e="browse-video-desc"]') || document.querySelector('h1[data-e2e="video-desc"]');
  const title = captionEl ? captionEl.textContent : "";

  return {
    views: estViews,
    likes: likes,
    saves: saves,
    reposts: shares,
    comments: comments,
    duration: 13,
    age_hours: 2,
    title: title
  };
}

async function predictStats(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      renderHud(data);
    } else {
      fallbackLocalPredict(payload);
    }
  } catch {
    fallbackLocalPredict(payload);
  }
}

function fallbackLocalPredict(p) {
  const views = Math.max(p.views, 1);
  const likeRate = (p.likes / views) * 100;
  const saveRate = (p.saves / views) * 100;
  const repostRate = (p.reposts / views) * 100;
  const totalEr = ((p.likes + p.saves + p.reposts) / views) * 100;

  const score = (likeRate + (repostRate * 4.5) + (saveRate * 2.2)) * 1.35;
  const prob = Math.min(Math.max(Math.round(100 / (1 + Math.exp(-0.12 * (score - 28.5)))), 1), 99);

  renderHud({
    probability_pct: prob,
    status_label: prob >= 70 ? "🚀 MEGA FYP" : prob >= 50 ? "📈 BREAKOUT" : "🟡 BASELINE",
    potential_views: prob >= 70 ? "100k - 500k+ Views" : prob >= 50 ? "30k - 80k Views" : "5k - 20k Views",
    badge_color: prob >= 70 ? "#00f2fe" : prob >= 50 ? "#10b981" : "#f59e0b",
    summary: prob >= 70 ? "Sinyal repost dan like sangat kuat!" : "Performa video rata-rata stabil.",
    metrics: {
      views: p.views,
      total_er: Math.round(totalEr * 10) / 10,
      repost_rate: Math.round(repostRate * 10) / 10,
      save_rate: Math.round(saveRate * 10) / 10
    }
  });
}

function renderHud(data) {
  const hud = document.getElementById("hudCard");
  hud.style.display = "flex";

  const num = document.getElementById("scoreNumber");
  const circle = document.getElementById("scoreCircle");
  const pill = document.getElementById("tierPill");
  const reach = document.getElementById("potentialViews");
  const note = document.getElementById("diagnosisNote");

  num.textContent = `${data.probability_pct}%`;
  circle.style.borderColor = data.badge_color;
  circle.style.boxShadow = `0 0 15px ${data.badge_color}50`;

  pill.textContent = data.status_label;
  pill.style.color = data.badge_color;
  pill.style.background = `${data.badge_color}18`;

  reach.textContent = `Estimasi: ${data.potential_views}`;
  note.textContent = data.summary;

  const m = data.metrics;
  document.getElementById("mViews").textContent = m.views.toLocaleString();
  document.getElementById("mEr").textContent = `${m.total_er}%`;
  document.getElementById("mRepost").textContent = `${m.repost_rate}%`;
  document.getElementById("mSave").textContent = `${m.save_rate}%`;
}

function setupManualCalc() {
  const btn = document.getElementById("btnCalcManual");
  btn.addEventListener("click", () => {
    const v = parseInt(document.getElementById("inpViews").value) || 10000;
    const l = parseInt(document.getElementById("inpLikes").value) || 1700;
    const s = parseInt(document.getElementById("inpSaves").value) || 450;
    const r = parseInt(document.getElementById("inpReposts").value) || 120;

    predictStats({
      views: v,
      likes: l,
      saves: s,
      reposts: r,
      comments: 20,
      duration: 13,
      age_hours: 2
    });
  });
}
