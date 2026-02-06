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
  durTime: document.getElementById("durTime")
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
    setTicker("⚠️ Missing video URL");
    return;
  }

  setPlayingUI(false);

  el.video.pause();
  el.video.src = v.src;
  el.video.poster = v.poster || "";
  el.video.dataset.resumeTime = "0";

  el.video.load();

  el.title.textContent = v.title;
  el.ridPill.textContent = `RID: ${v.rid}`;
  setTicker(`🎵 Now Playing: ${v.title}`);
  setURL(v.rid);

  if (autoplay) el.video.play().catch(() => {});
}

function renderGrid() {
  if (!el.grid) return;
  el.grid.innerHTML = "";

  library.videos.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card" + (i === index ? " active" : "");
    card.innerHTML = `
      <div class="ctitle">${v.title}</div>
      <div class="crid">RID: ${v.rid}</div>
    `;
    card.addEventListener("click", () => {
      index = i;
      loadVideo(library.videos[index], true);
      renderGrid();
    });
    el.grid.appendChild(card);
  });
}

async function init() {
  setTicker("⚡ Loading Retronyte playlist…");

  const res = await fetch(`${LIBRARY_URL}?cb=${Date.now()}`);
  if (!res.ok) throw new Error("Playlist fetch failed");

  library = await res.json();
  if (!library?.videos?.length) throw new Error("No videos in playlist");

  const rid = new URLSearchParams(location.search).get("v");
  const found = library.videos.findIndex(v => v.rid === rid);

  if (found >= 0) index = found;
  else {
    const latest = library.videos.findIndex(v => v.rid === library.latest);
    index = latest >= 0 ? latest : 0;
  }

  loadVideo(library.videos[index], false);
  renderGrid();

  /* === VIDEO STATE === */
  el.video.addEventListener("play", () => setPlayingUI(true));

  el.video.addEventListener("pause", () => {
    setPlayingUI(false);

    // Save resume time
    el.video.dataset.resumeTime = String(el.video.currentTime);

    // Snap back to poster
    el.video.currentTime = 0;
    el.video.load();
  });

  el.video.addEventListener("ended", () => {
    setPlayingUI(false);
    el.video.dataset.resumeTime = "0";
    el.video.currentTime = 0;
    el.video.load();
  });

  /* === CONTROLS === */
  el.btnPlay?.addEventListener("click", () => {
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
    el.video.closest(".stage")?.requestFullscreen?.();
  });

  el.video.addEventListener("loadedmetadata", () => {
    el.durTime.textContent = fmt(el.video.duration);
  });

  el.video.addEventListener("timeupdate", () => {
    el.curTime.textContent = fmt(el.video.currentTime);
    if (isFinite(el.video.duration) && el.video.duration > 0) {
      el.seek.value = Math.floor(
        (el.video.currentTime / el.video.duration) * 1000
      );
    }
  });

  el.seek?.addEventListener("input", () => {
    if (!isFinite(el.video.duration)) return;
    el.video.currentTime =
      (Number(el.seek.value) / 1000) * el.video.duration;
  });
}

init().catch(err => {
  console.error(err);
  setTicker("⚠️ Failed to load playlist");
});
