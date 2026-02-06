const LIBRARY_URL = "videos/library.json";

let library = null;
let currentIndex = 0;

const el = {
  video: document.getElementById("video"),
  now: document.getElementById("now-playing"),
  title: document.getElementById("title"),
  ridPill: document.getElementById("ridPill"),
  grid: document.getElementById("grid"),

  btnPlay: document.getElementById("btnPlay"),
  btnMute: document.getElementById("btnMute"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  btnFs: document.getElementById("btnFs"),

  seek: document.getElementById("seek"),
  vol: document.getElementById("vol"),
  curTime: document.getElementById("curTime"),
  durTime: document.getElementById("durTime"),
};

function fmt(t) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function setTicker(text) {
  // Make it scroll smoothly by repeating
  el.now.textContent = `${text}  •  ${text}  •  ${text}`;
}

function getRidFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get("v");
}

function setRidInUrl(rid) {
  const url = new URL(location.href);
  url.searchParams.set("v", rid);
  history.replaceState(null, "", url.toString());
}

function renderGrid() {
  if (!el.grid) return;
  el.grid.innerHTML = "";

  library.videos.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card" + (i === currentIndex ? " active" : "");
    card.dataset.index = String(i);
    card.innerHTML = `
      <div class="ctitle">${v.title}</div>
      <div class="crid">RID: ${v.rid}</div>
    `;
    card.addEventListener("click", () => loadByIndex(i, true));
    el.grid.appendChild(card);
  });
}

function markActiveCard() {
  if (!el.grid) return;
  [...el.grid.querySelectorAll(".card")].forEach(c => c.classList.remove("active"));
  const active = el.grid.querySelector(`.card[data-index="${currentIndex}"]`);
  if (active) active.classList.add("active");
}

function loadVideo(v, autoplay = true) {
  // Safety: if URL is missing
  if (!v?.src) {
    setTicker("⚠️ Missing video URL in library.json");
    return;
  }

  el.video.pause();
  el.video.src = v.src;
  el.video.load();

  if (el.title) el.title.textContent = v.title || "Retronyte Episode";
  if (el.ridPill) el.ridPill.textContent = `RID: ${v.rid || "—"}`;

  setTicker(`🎵 Now Playing: ${v.title || "Retronyte Episode"}`);
  setRidInUrl(v.rid || "latest");

  if (autoplay) el.video.play().catch(() => {});
}

function loadByIndex(i, autoplay) {
  currentIndex = Math.max(0, Math.min(i, library.videos.length - 1));
  loadVideo(library.videos[currentIndex], autoplay);
  markActiveCard();
}

function loadByRid(rid, autoplay) {
  const idx = library.videos.findIndex(v => v.rid === rid);
  loadByIndex(idx >= 0 ? idx : 0, autoplay);
}

async function init() {
  // Show immediate feedback (no more “stuck” without knowing)
  setTicker("⚡ Loading Retronyte playlist…");

  // Cache-bust so GitHub Pages updates immediately
  const res = await fetch(LIBRARY_URL + "?cb=" + Date.now());
  if (!res.ok) throw new Error(`Failed to load ${LIBRARY_URL}: ${res.status}`);

  library = await res.json();
  if (!library?.videos?.length) throw new Error("library.json has no videos[]");

  // Start with URL ?v=RID if present, else latest
  const ridFromUrl = getRidFromUrl();
  if (ridFromUrl) loadByRid(ridFromUrl, false);
  else loadByRid(library.latest || library.videos[0].rid, false);

  renderGrid();
  markActiveCard();

  // Controls
  el.btnPlay?.addEventListener("click", () => {
    if (el.video.paused) el.video.play().catch(()=>{});
    else el.video.pause();
  });
  el.video.addEventListener("play", () => { if (el.btnPlay) el.btnPlay.textContent = "⏸"; });
  el.video.addEventListener("pause", () => { if (el.btnPlay) el.btnPlay.textContent = "▶"; });

  el.btnMute?.addEventListener("click", () => {
    el.video.muted = !el.video.muted;
    if (el.btnMute) el.btnMute.textContent = el.video.muted ? "🔇" : "🔊";
  });

  el.vol?.addEventListener("input", () => {
    el.video.volume = Number(el.vol.value);
    if (el.video.volume === 0) {
      el.video.muted = true;
      if (el.btnMute) el.btnMute.textContent = "🔇";
    } else {
      el.video.muted = false;
      if (el.btnMute) el.btnMute.textContent = "🔊";
    }
  });

  el.btnPrev?.addEventListener("click", () => loadByIndex(currentIndex - 1, true));
  el.btnNext?.addEventListener("click", () => loadByIndex(currentIndex + 1, true));

  el.btnFs?.addEventListener("click", () => {
    const stage = el.video.closest(".stage");
    if (!document.fullscreenElement) stage?.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  // Time + seek
  el.video.addEventListener("loadedmetadata", () => {
    if (el.durTime) el.durTime.textContent = fmt(el.video.duration);
  });
  el.video.addEventListener("timeupdate", () => {
    if (el.curTime) el.curTime.textContent = fmt(el.video.currentTime);
    if (isFinite(el.video.duration) && el.video.duration > 0 && el.seek) {
      el.seek.value = String(Math.floor((el.video.currentTime / el.video.duration) * 1000));
    }
  });

  el.seek?.addEventListener("input", () => {
    if (!isFinite(el.video.duration) || el.video.duration <= 0) return;
    const pct = Number(el.seek.value) / 1000;
    el.video.currentTime = pct * el.video.duration;
  });

  // Auto-next
  el.video.addEventListener("ended", () => {
    if (currentIndex < library.videos.length - 1) loadByIndex(currentIndex + 1, true);
  });

  // Finally start playback
  loadByIndex(currentIndex, true);
}

init().catch((e) => {
  console.error(e);
  setTicker("⚠️ Playlist failed to load — check videos/library.json URL");
});
