const LIBRARY_URL = "videos/library.json";

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

let library = null;
let index = 0;

function fmt(t) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function setTicker(text) {
  if (!el.now) return;
  el.now.textContent = `${text} • ${text} • ${text}`;
}

function setURL(rid) {
  const u = new URL(location.href);
  u.searchParams.set("v", rid);
  history.replaceState(null, "", u.toString());
}

function setPlayingUI(isPlaying) {
  document.body.classList.toggle("playing", !!isPlaying);
}

function loadVideo(v, autoplay = false) {
  if (!v || !v.src) {
    setTicker("⚠️ Missing video URL in library.json");
    return;
  }

  setPlayingUI(false);

  el.video.pause();
  el.video.src = v.src;
  el.video.poster = v.poster || "";
  el.video.load();

  if (el.title) el.title.textContent = v.title || "Retronyte Episode";
  if (el.ridPill) el.ridPill.textContent = `RID: ${v.rid || "—"}`;

  setTicker(`🎵 Now Playing: ${v.title || "Retronyte Episode"}`);
  setURL(v.rid || "latest");

  if (autoplay) el.video.play().catch(() => {});
}

function renderGrid() {
  if (!el.grid) return;
  el.grid.innerHTML = "";

  library.videos.forEach((v, i) => {
    const c = document.createElement("div");
    c.className = "card" + (i === index ? " active" : "");
    c.innerHTML = `
      <div class="ctitle">${v.title || "Untitled Episode"}</div>
      <div class="crid">RID: ${v.rid || "—"}</div>
    `;
    c.addEventListener("click", () => {
      index = i;
      loadVideo(library.videos[index], true);
      renderGrid();
    });
    el.grid.appendChild(c);
  });
}

async function init() {
  setTicker("⚡ Loading Retronyte playlist…");

  const res = await fetch(`${LIBRARY_URL}?cb=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to fetch ${LIBRARY_URL}: ${res.status}`);

  library = await res.json();
  if (!library?.videos?.length) throw new Error("library.json has no videos[]");

  const rid = new URLSearchParams(location.search).get("v");
  const found = library.videos.findIndex((v) => v.rid === rid);

  if (found >= 0) index = found;
  else {
    const latestIndex = library.videos.findIndex((v) => v.rid === library.latest);
    index = latestIndex >= 0 ? latestIndex : 0;
  }

  loadVideo(library.videos[index], false);
  renderGrid();

  // Lightning only while playing
  el.video.addEventListener("play", () => setPlayingUI(true));
el.video.addEventListener("pause", () => {
  setPlayingUI(false);

  // Save where we paused
  el.video.dataset.resumeTime = String(el.video.currentTime);

  // Snap back to poster
  el.video.currentTime = 0;
});

  el.video.addEventListener("ended", () => setPlayingUI(false));

  // Buttons
  btnPlay.addEventListener("click", () => {
  if (el.video.paused) {
    const resume = Number(el.video.dataset.resumeTime || "0");
    if (resume > 0) {
      el.video.currentTime = resume;
      el.video.dataset.resumeTime = "0";
    }
    el.video.play().catch(() => {});
  } else {
    el.video.pause();
  }
});


  el.btnMute?.addEventListener("click", () => {
    el.video.muted = !el.video.muted;
    el.btnMute.textContent = el.video.muted ? "🔇" : "🔊";
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

  el.btnPrev?.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    loadVideo(library.videos[index], true);
    renderGrid();
  });

  el.btnNext?.addEventListener("click", () => {
    index = Math.min(library.videos.length - 1, index + 1);
    loadVideo(library.videos[index], true);
    renderGrid();
  });

  el.btnFs?.addEventListener("click", () => {
    const stage = el.video.closest(".stage");
    stage?.requestFullscreen?.();
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
}

init().catch((err) => {
  console.error(err);
  setTicker("⚠️ Playlist failed to load — check videos/library.json");
});
