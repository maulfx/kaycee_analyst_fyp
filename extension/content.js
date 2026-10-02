/**
 * TikTok FYP Radar - Content Script
 * Automatically injects a floating prediction badge on TikTok video players.
 */

console.log("[FYP Radar] Extension Content Script Active");

let lastUrl = location.href;

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(inspectAndInjectBadge, 1200);
  }
}, 1000);

setTimeout(inspectAndInjectBadge, 1500);

function inspectAndInjectBadge() {
  if (document.getElementById("fyp-radar-overlay-badge")) {
    return;
  }

  // Find video container
  const videoPlayer = document.querySelector('[data-e2e="browse-video-desc"]') || document.querySelector('.css-1qelqhr-DivContainer');
  if (!videoPlayer) return;

  const badge = document.createElement("div");
  badge.id = "fyp-radar-overlay-badge";
  badge.className = "fyp-radar-badge";
  badge.innerHTML = `
    <div class="fyp-badge-inner">
      <span class="fyp-icon">⚡</span>
      <span class="fyp-text">FYP Radar</span>
      <span class="fyp-pill">Live Ready</span>
    </div>
  `;

  badge.addEventListener("click", () => {
    alert("⚡ TikTok FYP Radar: Buka icon extension di toolbar browser Anda untuk melihat skor dan diagnosa lengkap video ini!");
  });

  document.body.appendChild(badge);
}
