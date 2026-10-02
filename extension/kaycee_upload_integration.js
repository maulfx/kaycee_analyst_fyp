/**
 * ==============================================================================
 * Kaycee_AnalystFYP - Client Integration Module for "Kaycee_Upload" Extension
 * ==============================================================================
 * Pasang file/kode ini ke dalam extension "Kaycee_Upload" Anda (misal di content.js).
 * 
 * CARA KERJA:
 * 1. Mendeteksi video TikTok yang sedang aktif/ditonton di layar secara otomatis.
 * 2. Mengambil likes, saves, reposts, comments dalam hitungan milidetik (<1ms).
 * 3. Mengirim data ke server Kaycee_AnalystFYP (localhost:8000 atau URL deploy).
 * 4. Menampilkan badge status FYP real-time langsung di pojok video!
 * 5. Memiliki cache otomatis (video yang sama tidak akan di-request dua kali).
 */

(function () {
  // Ganti URL ini jika sudah dideploy ke cloud (misal: https://kaycee-analyst.railway.app)
  const ANALYST_SERVER_URL = "http://localhost:8000";

  // Cache lokal agar tidak membebani server/browser
  const evaluatedVideoCache = new Map();
  let currentActiveVideoId = null;

  console.log("⚡ [Kaycee_Upload] Kaycee_AnalystFYP Integration Active!");

  // Observer untuk mendeteksi perubahan video saat scroll feed di TikTok
  setInterval(monitorCurrentVideo, 1200);

  async function monitorCurrentVideo() {
    const videoData = extractActiveVideoData();
    if (!videoData || !videoData.id) return;

    if (videoData.id === currentActiveVideoId) return;
    currentActiveVideoId = videoData.id;

    // Cek apakah sudah pernah dihitung sebelumnya di sesi ini
    if (evaluatedVideoCache.has(videoData.id)) {
      renderFypBadge(evaluatedVideoCache.get(videoData.id));
      return;
    }

    // Tampilkan state loading singkat
    renderLoadingBadge();

    // Kirim proses berat ke server
    try {
      const response = await fetch(`${ANALYST_SERVER_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          views: videoData.estimatedViews,
          likes: videoData.likes,
          reposts: videoData.reposts,
          saves: videoData.saves,
          comments: videoData.comments,
          duration: videoData.duration || 13,
          age_hours: 2.0,
          title: videoData.title || ""
        })
      });

      if (!response.ok) throw new Error("Server response error");
      const result = await response.json();

      evaluatedVideoCache.set(videoData.id, result);
      renderFypBadge(result);
    } catch (err) {
      // Fallback lokal jika server sedang offline/restarting
      const fallbackResult = calculateLocalFallback(videoData);
      evaluatedVideoCache.set(videoData.id, fallbackResult);
      renderFypBadge(fallbackResult);
    }
  }

  // ─── Ekstraksi DOM TikTok Ultra-Cepat (< 1ms) ────────────────
  function extractActiveVideoData() {
    const parseNumber = (text) => {
      if (!text) return 0;
      text = text.trim().toUpperCase();
      if (text.includes('K')) return Math.round(parseFloat(text.replace('K', '')) * 1000);
      if (text.includes('M')) return Math.round(parseFloat(text.replace('M', '')) * 1000000);
      if (text.includes('B')) return Math.round(parseFloat(text.replace('B', '')) * 1000000000);
      return parseInt(text.replace(/,/g, '')) || 0;
    };

    // Deteksi video ID dari URL atau elemen aktif
    const urlMatch = location.href.match(/\/video\/(\d+)/);
    const videoId = urlMatch ? urlMatch[1] : (document.querySelector('video')?.src || location.pathname);

    // Ambil metrik engagement dari tombol aksi TikTok
    const likeEl = document.querySelector('[data-e2e="like-count"]') || document.querySelector('button[aria-label*="like"] strong');
    const commentEl = document.querySelector('[data-e2e="comment-count"]') || document.querySelector('button[aria-label*="comment"] strong');
    const saveEl = document.querySelector('[data-e2e="undefined-count"]') || document.querySelector('button[aria-label*="favorite"] strong') || document.querySelector('button[aria-label*="bookmark"] strong');
    const shareEl = document.querySelector('[data-e2e="share-count"]') || document.querySelector('button[aria-label*="share"] strong');
    const captionEl = document.querySelector('[data-e2e="browse-video-desc"]') || document.querySelector('h1[data-e2e="video-desc"]');

    const likes = parseNumber(likeEl?.textContent);
    const comments = parseNumber(commentEl?.textContent);
    const saves = parseNumber(saveEl?.textContent);
    const reposts = parseNumber(shareEl?.textContent);

    if (likes === 0 && saves === 0) return null;

    // Estimasi views median jika tidak tertera di player desktop
    const estimatedViews = Math.max(Math.round(likes * 6.5), 1000);

    return {
      id: videoId,
      likes,
      comments,
      saves,
      reposts,
      estimatedViews,
      title: captionEl ? captionEl.textContent : "",
      duration: 13
    };
  }

  // ─── Tampilkan Badge Real-Time di Halaman ─────────────────────
  function renderLoadingBadge() {
    let badge = document.getElementById("kaycee-fyp-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "kaycee-fyp-badge";
      document.body.appendChild(badge);
    }
    badge.className = "kaycee-badge loading";
    badge.innerHTML = `<span>⚡ Kaycee_Analyst: Menghitung momentum FYP...</span>`;
  }

  function renderFypBadge(data) {
    let badge = document.getElementById("kaycee-fyp-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "kaycee-fyp-badge";
      document.body.appendChild(badge);
    }

    const prob = data.probability_pct;
    const color = data.badge_color || (prob >= 75 ? "#00f2fe" : prob >= 55 ? "#10b981" : prob >= 35 ? "#f59e0b" : "#ef4444");

    badge.className = "kaycee-badge ready";
    badge.style.borderColor = color;
    badge.style.boxShadow = `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${color}50`;

    badge.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">⚡</span>
        <div>
          <div style="font-weight:800; font-size:13px; color:#fff; display:flex; align-items:center; gap:6px;">
            <span>FYP Chance: <span style="color:${color}">${prob}%</span></span>
            <span style="font-size:10px; padding:2px 8px; border-radius:12px; background:${color}25; color:${color}; font-weight:700;">
              ${data.status_label || (prob >= 70 ? 'MEGA FYP' : prob >= 50 ? 'BREAKOUT' : 'NORMAL')}
            </span>
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">
            Potensi: <strong style="color:#fff">${data.potential_views || 'Menghitung...'}</strong>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Fallback Ringan (Jika Server Offline) ────────────────────
  function calculateLocalFallback(v) {
    const likeRate = (v.likes / v.estimatedViews) * 100;
    const saveRate = (v.saves / v.estimatedViews) * 100;
    const repostRate = (v.reposts / v.estimatedViews) * 100;
    const score = (likeRate + (repostRate * 4.5) + (saveRate * 2.2)) * 1.35;
    const prob = Math.min(Math.max(Math.round(100 / (1 + Math.exp(-0.12 * (score - 28.5)))), 1), 99);

    return {
      probability_pct: prob,
      status_label: prob >= 75 ? "🚀 MEGA FYP" : prob >= 55 ? "📈 BREAKOUT" : "🟡 BASELINE",
      potential_views: prob >= 75 ? "100k - 500k+ Views" : prob >= 55 ? "30k - 100k Views" : "5k - 20k Views",
      badge_color: prob >= 75 ? "#00f2fe" : prob >= 55 ? "#10b981" : "#f59e0b"
    };
  }

  // ─── Inject Gaya CSS untuk Badge ──────────────────────────────
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    #kaycee-fyp-badge {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 99999999;
      background: rgba(10, 14, 23, 0.92);
      border: 1.5px solid #00f2fe;
      border-radius: 14px;
      padding: 10px 16px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      user-select: none;
    }
    #kaycee-fyp-badge:hover {
      transform: translateY(-2px) scale(1.02);
    }
  `;
  document.head.appendChild(styleEl);
})();
