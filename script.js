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

const fmt = t =>
  isFinite(t)
    ? `${Math.floor(t / 60)}:${Math.floor(t % 60)
        .toString()
        .padStart(2, "0")}`
    : "0:00";

function setTicker(text) {
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
  setPlayingUI(false);

  el.video.pause();
  el.video.src = v.src;
  el.video.poster = v.poster || "";   // ✅ thumbnail before play
  el.video.load();

  el.title.textContent = v.title;
  el.ridPill.textContent = `RID: ${v.rid}`;
  setTicker(`🎵 Now Playing: ${v.title}`);
  setURL(v.rid);

  if (autoplay) el.video.play().catch(() => {});
}

function renderGrid() {
  el.grid.innerHTML = "";
  library.videos.forEach((v, i) => {
    const c = document.createElement("div");
    c.className = "card" + (i === index ? " active" : "");
    c.innerHTML = `<div class="ctitle">${v.title}</div><div class="crid">RID: ${v.rid}</div>`;
    c.onclick = () => {
      index = i;
      loadVideo(v, true);
      renderGrid();
    };
    el.grid.appendChild(c);
  });
}

async function init() {
  setTicker("⚡ Loading Retronyte playlist…");

  const res = await fetch(`${LIBRARY_URL}?cb=${Date.now()}`);
  if (!res.ok) throw new Error("playlist fetch failed");
  library = await res.json();
  if (!library?.videos?.length) throw new Error("no videos");

  const rid = new URLSearchParams(location.search).get("v");
  const found = library.videos.findIndex(v => v.rid === rid);
  index = found >= 0 ? found : library.videos.findIndex(v => v.rid === library.latest);
  if (index < 0) index = 0;

  loadVideo(library.videos[index], false);
  renderGrid();

  // ✅ playing state controls lightning visibility
  el.video.addEventListener("play", () => setPlayingUI(true));
  el.video.addEventListener("pause", () => setPlayingUI(false));
  el.video.addEventListener("ended", () => setPlayingUI(false));

  // buttons
  el.btnPlay.onclick = () => (el.video.paused ? el.video.play() : el.video.pause());

  el.btnMute.onclick = () => {
    el.video.muted = !el.video.muted;
    el.btnMute.textContent = el.video.muted ? "🔇" : "🔊";
  };

  el.vol.oninput = () => (el.video.volume = el.vol.value);

  el.btnPrev.onclick = () => {
    index = Math.max(0, index - 1);
    loadVideo(library.videos[index], true);
    renderGrid();
  };

  el.btnNext.onclick = () => {
    index = Math.min(library.videos.length - 1, index + 1);
    loadVideo(library.videos[index], true);
    renderGrid();
  };

  el.btnFs.onclick = () => el.video.closest(".stage")?.requestFullscreen?.();

  // time + seek
  el.video.addEventListener("loadedmetadata", () => {
    el.durTime.textContent = fmt(el.video.duration);
  });

  el.video.addEventListener("timeupdate", () => {
    el.curTime.textContent = fmt(el.video.currentTime);
    if (isFinite(el.video.duration) && el.video.duration > 0) {
      el.seek.value = ((el.video.currentTime / el.video.duration) * 1000).toFixed(0);
    }
  });

  el.seek.oninput = () => {
    if (!isFinite(el.video.duration) || el.video.duration <= 0) return;
    el.video.currentTime = (el.seek.value / 1000) * el.video.duration;
  });
}

init().catch(() => setTicker("⚠️ Failed to load playlist"));
