/**
 * ==============================================================================
 * Kaycee_AnalystFYP Integration Module for Kaycee Studio / Kaycee_Uploud
 * Cloud Backend: https://kayceeanalystfyp-kaycee-try.up.railway.app
 * ==============================================================================
 */

(function () {
  if (window.__KAYCEE_ANALYST_LOADED__) return;
  window.__KAYCEE_ANALYST_LOADED__ = true;

  const ANALYST_SERVER_URL = "https://kayceeanalystfyp-kaycee-try.up.railway.app";
  const analyzedCache = new Map();
  let currentActiveId = null;
  let isMinimized = false;

  console.log("⚡ [Kaycee Studio] Kaycee_AnalystFYP Real-Time Engine Active!");

  // Safe style injection: supports document_start or document_idle
  function safeInjectStyle() {
    if (document.getElementById("kaycee-fyp-radar-style")) return;
    const target = document.head || document.documentElement || document.body;
    if (target) {
      target.appendChild(style);
    } else {
      setTimeout(safeInjectStyle, 100);
    }
  }

  // Safe Polling observer: cek perubahan video setiap 1.2 detik
  const intervalId = setInterval(() => {
    try {
      // Jika ekstensi baru saja di-reload di browser, hentikan timer agar tidak error
      if (typeof chrome !== "undefined" && chrome.runtime && !chrome.runtime.id) {
        clearInterval(intervalId);
        return;
      }
      inspectCurrentVideo();
    } catch (e) {
      if (e && e.message && e.message.includes("Extension context invalidated")) {
        clearInterval(intervalId);
      }
    }
  }, 1200);

  async function inspectCurrentVideo() {
    if (!document.body && !document.documentElement) return;

    const videoData = extractActiveVideo();
    if (!videoData || !videoData.id) return;

    if (videoData.id === currentActiveId) return;
    currentActiveId = videoData.id;

    // Cek cache lokal agar tidak spam request ke server
    if (analyzedCache.has(videoData.id)) {
      renderBadge(analyzedCache.get(videoData.id));
      return;
    }

    renderLoading();

    try {
      const response = await fetch(`${ANALYST_SERVER_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          views: videoData.views,
          likes: videoData.likes,
          comments: videoData.comments,
          saves: videoData.saves,
          reposts: videoData.reposts,
          duration_sec: videoData.duration || 13,
          is_custom_audio: true,
          topic_category: "auto"
        })
      });

      if (!response.ok) throw new Error("Server error: " + response.status);
      const result = await response.json();
      analyzedCache.set(videoData.id, result);
      renderBadge(result);
    } catch (err) {
      console.warn("[Kaycee_Analyst] Server unreachable, fallback to local formula:", err);
      const fallbackResult = localCalculate(videoData);
      analyzedCache.set(videoData.id, fallbackResult);
      renderBadge(fallbackResult);
    }
  }

  function extractActiveVideo() {
    // 1. Cek Mode Modal / Direct Video URL (/video/12345...)
    const urlMatch = window.location.pathname.match(/\/video\/(\d+)/);
    const videoIdFromUrl = urlMatch ? urlMatch[1] : null;

    // Cari container aktif
    const containers = document.querySelectorAll(
      '[data-e2e="recommend-list-item-container"], [class*="DivItemContainer"], [class*="DivVideoFeedList"] > div, article, [data-e2e="browse-video"]'
    );

    let activeEl = null;
    let videoId = videoIdFromUrl;

    if (containers.length > 0) {
      const centerY = window.innerHeight / 2;
      let minDistance = Infinity;

      containers.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.height > 100) {
          const distance = Math.abs(rect.top + rect.height / 2 - centerY);
          if (distance < minDistance) {
            minDistance = distance;
            activeEl = el;
          }
        }
      });
    }

    if (!activeEl) {
      activeEl = document.querySelector('[data-e2e="browse-video"]') || document.body;
    }

    if (!videoId && activeEl) {
      const aTag = activeEl.querySelector('a[href*="/video/"]');
      if (aTag) {
        const m = aTag.href.match(/\/video\/(\d+)/);
        if (m) videoId = m[1];
      }
    }

    if (!videoId) return null;

    // Ekstraksi Metrik Interaksi
    const parseNum = (selector) => {
      const el = activeEl ? activeEl.querySelector(selector) : null;
      if (!el) return 0;
      return parseKMB(el.textContent.trim());
    };

    const likes = parseNum('[data-e2e="like-count"], [data-e2e="browse-like-count"]');
    const comments = parseNum('[data-e2e="comment-count"], [data-e2e="browse-comment-count"]');
    const saves = parseNum('[data-e2e="undefined-count"], [data-e2e="favorite-count"], [data-e2e="browse-favorite-count"]');
    const reposts = parseNum('[data-e2e="share-count"], [data-e2e="browse-share-count"]');

    let views = 0;
    const viewsEl = activeEl ? activeEl.querySelector('[data-e2e="video-views"], [class*="DivPlayCount"]') : null;
    if (viewsEl) {
      views = parseKMB(viewsEl.textContent.trim());
    }
    if (views <= 0 && likes > 0) {
      views = Math.round(likes / 0.156);
    }

    return {
      id: videoId,
      views: views || 1000,
      likes: likes || 1,
      comments: comments || 0,
      saves: saves || 0,
      reposts: reposts || 0,
      duration: 13
    };
  }

  function parseKMB(str) {
    if (!str) return 0;
    str = str.replace(/,/g, '').trim().toUpperCase();
    let mult = 1;
    if (str.endsWith('K')) { mult = 1000; str = str.slice(0, -1); }
    else if (str.endsWith('M')) { mult = 1000000; str = str.slice(0, -1); }
    else if (str.endsWith('B')) { mult = 1000000000; str = str.slice(0, -1); }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num * mult);
  }

  function getBadgeContainer() {
    let container = document.getElementById("kaycee-fyp-radar-host");
    if (!container) {
      container = document.createElement("div");
      container.id = "kaycee-fyp-radar-host";
      const target = document.body || document.documentElement;
      if (target) {
        target.appendChild(container);
      }
    }
    return container;
  }

  function renderLoading() {
    const host = getBadgeContainer();
    if (!host) return;
    host.innerHTML = `
      <div class="kaycee-fyp-card loading">
        <span class="pulse-icon">⚡</span>
        <span class="loading-text">Kaycee_AnalystFYP: Menganalisa...</span>
      </div>
    `;
  }

  function renderBadge(data) {
    const host = getBadgeContainer();
    if (!host) return;

    const prob = data.probability_pct;
    const color = data.badge_color || (prob >= 75 ? "#00f2fe" : prob >= 55 ? "#10b981" : prob >= 35 ? "#f59e0b" : "#ef4444");

    if (isMinimized) {
      host.innerHTML = `
        <div class="kaycee-fyp-minimized" style="border-color: ${color}; box-shadow: 0 0 15px ${color}60;" title="Klik untuk memperbesar">
          <span>⚡</span>
          <strong style="color: ${color}">${prob}%</strong>
        </div>
      `;
      host.querySelector(".kaycee-fyp-minimized").onclick = () => {
        isMinimized = false;
        renderBadge(data);
      };
      return;
    }

    const m = data.metrics || {};
    const repost = m.repost_rate !== undefined ? `${m.repost_rate}%` : "-";
    const save = m.save_rate !== undefined ? `${m.save_rate}%` : "-";
    const like = m.like_rate !== undefined ? `${m.like_rate}%` : "-";

    host.innerHTML = `
      <div class="kaycee-fyp-card" style="border-color: ${color}; box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${color}35;">
        <div class="card-top">
          <div class="brand-line">
            <span class="logo-bolt">⚡</span>
            <span class="brand-title">Kaycee_AnalystFYP</span>
            <span class="tier-tag" style="background:${color}20; color:${color}; border:1px solid ${color}40;">
              ${data.status_label || (prob >= 70 ? 'MEGA FYP' : prob >= 50 ? 'BREAKOUT' : 'NORMAL')}
            </span>
          </div>
          <button class="btn-toggle-min" title="Kecilkan">✕</button>
        </div>

        <div class="score-row">
          <div class="score-display">
            <span class="score-val" style="color:${color}">${prob}%</span>
            <span class="score-sub">Peluang FYP</span>
          </div>
          <div class="reach-display">
            <span class="reach-label">Potensi Jangkauan:</span>
            <strong class="reach-val" style="color:#fff">${data.potential_views || '-'}</strong>
          </div>
        </div>

        <div class="stats-row">
          <div class="mini-stat">
            <span>🔁 Repost</span>
            <strong>${repost}</strong>
          </div>
          <div class="mini-stat">
            <span>🔖 Save</span>
            <strong>${save}</strong>
          </div>
          <div class="mini-stat">
            <span>❤️ Like</span>
            <strong>${like}</strong>
          </div>
        </div>

        <div class="card-footer">
          <a href="${ANALYST_SERVER_URL}" target="_blank" class="dashboard-link">Buka Live Dashboard ↗</a>
        </div>
      </div>
    `;

    const toggleBtn = host.querySelector(".btn-toggle-min");
    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        isMinimized = true;
        renderBadge(data);
      };
    }
  }

  
  // Listener dari Tombol Sidebar TikTok (postMessage)
  window.addEventListener("message", (event) => {
    if (event.data && event.data.type === "KAYCEE_TRIGGER_ANALYST") {
      isMinimized = false;
      currentActiveId = null;
      inspectCurrentVideo();
    }
  });

  // Listener dari Popup Ekstensi
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "GET_FYP_ANALYSIS" || request.action === "TRIGGER_ANALYST") {
        isMinimized = false;
        currentActiveId = null;
        inspectCurrentVideo().then((res) => {
          sendResponse({ success: true, data: res });
        });
        return true;
      }
    });
  }

  // Fallback Formula Lokal
  function localCalculate(v) {
    const likeRate = (v.likes / v.views) * 100;
    const saveRate = (v.saves / v.views) * 100;
    const repostRate = (v.reposts / v.views) * 100;
    const score = (likeRate + (repostRate * 4.5) + (saveRate * 2.2)) * 1.35;
    const prob = Math.min(Math.max(Math.round(100 / (1 + Math.exp(-0.12 * (score - 28.5)))), 1), 99);

    return {
      probability_pct: prob,
      status_label: prob >= 75 ? "🚀 MEGA FYP" : prob >= 55 ? "🔥 BREAKOUT" : "⚡ BASELINE",
      potential_views: prob >= 75 ? "100k - 500k+ Views" : prob >= 55 ? "30k - 100k Views" : "5k - 20k Views",
      badge_color: prob >= 75 ? "#00f2fe" : prob >= 55 ? "#10b981" : "#f59e0b",
      metrics: {
        like_rate: Math.round(likeRate * 10) / 10,
        save_rate: Math.round(saveRate * 10) / 10,
        repost_rate: Math.round(repostRate * 10) / 10
      }
    };
  }

  // CSS Stylesheet
  const style = document.createElement("style");
  style.id = "kaycee-fyp-radar-style";
  style.textContent = `
    #kaycee-fyp-radar-host {
      position: fixed;
      top: 90px;
      right: 24px;
      z-index: 999999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    }
    .kaycee-fyp-card {
      background: rgba(11, 15, 25, 0.94);
      border: 1.5px solid #00f2fe;
      border-radius: 14px;
      padding: 14px;
      width: 270px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      color: #fff;
    }
    .kaycee-fyp-card.loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      width: auto;
      font-size: 12px;
      color: #94a3b8;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .brand-line {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logo-bolt {
      font-size: 15px;
      color: #00f2fe;
    }
    .brand-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: #f8fafc;
    }
    .tier-tag {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      text-transform: uppercase;
    }
    .btn-toggle-min {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #94a3b8;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-toggle-min:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    .score-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.35);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }
    .score-display {
      display: flex;
      flex-direction: column;
    }
    .score-val {
      font-size: 26px;
      font-weight: 800;
      line-height: 1;
      font-family: monospace;
    }
    .score-sub {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .reach-display {
      text-align: right;
    }
    .reach-label {
      display: block;
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
    }
    .reach-val {
      font-size: 12px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .mini-stat {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      padding: 4px 6px;
      text-align: center;
    }
    .mini-stat span {
      display: block;
      font-size: 9px;
      color: #64748b;
    }
    .mini-stat strong {
      font-size: 11px;
      font-family: monospace;
      color: #fff;
    }
    .card-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 8px;
      text-align: center;
    }
    .dashboard-link {
      font-size: 10px;
      color: #00f2fe;
      text-decoration: none;
      font-weight: 600;
    }
    .dashboard-link:hover {
      text-decoration: underline;
    }
    .kaycee-fyp-minimized {
      background: rgba(11, 15, 25, 0.92);
      border: 1.5px solid #00f2fe;
      border-radius: 50px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      backdrop-filter: blur(12px);
      transition: transform 0.2s ease;
      font-size: 13px;
    }
    .kaycee-fyp-minimized:hover {
      transform: scale(1.05);
    }
  `;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInjectStyle);
  } else {
    safeInjectStyle();
  }
})();
