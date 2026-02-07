const el = {
  stage: document.getElementById("stage"),
  video: document.getElementById("video"),
  pausePoster: document.getElementById("pausePoster"),
  overlayPlay: document.getElementById("overlayPlay"),

  epTitle: document.getElementById("epTitle"),
  ridPill: document.getElementById("ridPill"),
  subline: document.getElementById("subline"),
  ticker: document.getElementById("ticker"),

  grid: document.getElementById("grid"),

  btnPrev: document.getElementById("btnPrev"),
  btnBack: document.getElementById("btnBack"),
  btnPlay: document.getElementById("btnPlay"),
  btnFwd: document.getElementById("btnFwd"),
  btnNext: document.getElementById("btnNext"),

  seek: document.getElementById("seek"),
  vol: document.getElementById("vol"),
  timeNow: document.getElementById("timeNow"),
  timeDur: document.getElementById("timeDur"),
};

let library = [];
let currentIndex = 0;

function fmtTime(s){
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2,"0")}`;
}

function setTicker(msg){
  el.ticker.textContent = msg || "";
}

function setStageState({ playing, paused }) {
  el.stage.classList.toggle("playing", !!playing);
  el.stage.classList.toggle("paused", !!paused);
}

function applyPausePoster(v){
  // If poster exists, use it for the pause overlay image
  if (v?.poster) {
    el.pausePoster.src = v.poster;
  } else {
    el.pausePoster.removeAttribute("src");
  }
}

function loadVideo(v, autoplay = false){
  if (!v || !v.src){
    el.epTitle.textContent = "Missing video src in library.json";
    el.ridPill.textContent = "RID: —";
    setTicker("⚠ Could not load this episode.");
    return;
  }

  // set metadata
  el.epTitle.textContent = v.title || "Retronyte Episode";
  el.ridPill.textContent = `RID: ${v.rid || "—"}`;

  // hide any “Internet Archive” mention
  el.subline.textContent = v.subtitle || "";

  // load video
  el.video.pause();
  el.video.src = v.src;

  // poster for initial load (browser will show before first play)
  if (v.poster) el.video.poster = v.poster;
  else el.video.removeAttribute("poster");

  applyPausePoster(v);

  // initial stage UI: paused poster visible + overlay visible
  setStageState({ playing:false, paused:true });
  setTicker(`♫ Ready: ${v.title || "Episode"}`);

  el.video.load();

  if (autoplay) {
    // play after metadata is ready (more reliable)
    el.video.play().catch(()=>{});
  }
}

function playPause(){
  if (el.video.paused) el.video.play().catch(()=>{});
  else el.video.pause();
}

function seekToRatio(r){
  if (!isFinite(el.video.duration) || el.video.duration <= 0) return;
  el.video.currentTime = el.video.duration * r;
}

function renderGrid(){
  el.grid.innerHTML = "";
  library.forEach((v, idx) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.innerHTML = `
      <div class="tile-title">${escapeHtml(v.title || v.rid || "Episode")}</div>
      <div class="tile-rid">RID: ${escapeHtml(v.rid || "—")}</div>
    `;
    tile.addEventListener("click", () => {
      currentIndex = idx;
      loadVideo(library[currentIndex], true);
      // update URL so sharing works
      setURL(library[currentIndex].rid);
    });
    el.grid.appendChild(tile);
  });
}

function setURL(rid){
  const u = new URL(window.location.href);
  if (rid) u.searchParams.set("v", rid);
  else u.searchParams.delete("v");
  history.replaceState({}, "", u.toString());
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

/* ---------- Events ---------- */

// Overlay play button
el.overlayPlay.addEventListener("click", () => {
  el.video.play().catch(()=>{});
});

// Clicking stage toggles play/pause (nice arcade feel)
el.stage.addEventListener("click", (e) => {
  // don't double-trigger if you clicked the overlay button itself
  if (e.target === el.overlayPlay || el.overlayPlay.contains(e.target)) return;
  playPause();
});

// Spacebar play/pause (unless typing)
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;

  const tag = (document.activeElement?.tagName || "").toLowerCase();
  const typing = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;
  if (typing) return;

  e.preventDefault();
  playPause();
});

// Video state -> stage classes + pause-poster overlay behavior
el.video.addEventListener("play", () => {
  setStageState({ playing:true, paused:false });
  setTicker(`♫ Now Playing: ${el.epTitle.textContent}`);
});
el.video.addEventListener("pause", () => {
  // show pause poster overlay (fake “thumbnail returns”)
  setStageState({ playing:false, paused:true });
  setTicker(`⏸ Paused: ${el.epTitle.textContent}`);
});
el.video.addEventListener("ended", () => {
  setStageState({ playing:false, paused:true });
  setTicker(`■ Finished: ${el.epTitle.textContent}`);
});

// Controls
el.btnPlay.addEventListener("click", playPause);
el.btnBack.addEventListener("click", () => el.video.currentTime = Math.max(0, el.video.currentTime - 10));
el.btnFwd.addEventListener("click", () => el.video.currentTime = Math.min(el.video.duration || 0, el.video.currentTime + 10));

el.btnPrev.addEventListener("click", () => {
  if (!library.length) return;
  currentIndex = (currentIndex - 1 + library.length) % library.length;
  loadVideo(library[currentIndex], true);
  setURL(library[currentIndex].rid);
});
el.btnNext.addEventListener("click", () => {
  if (!library.length) return;
  currentIndex = (currentIndex + 1) % library.length;
  loadVideo(library[currentIndex], true);
  setURL(library[currentIndex].rid);
});

// Seek bar
el.seek.addEventListener("input", () => {
  const r = Number(el.seek.value) / 1000;
  seekToRatio(r);
});

// Volume
el.vol.addEventListener("input", () => {
  el.video.volume = Number(el.vol.value);
});

// Time update
el.video.addEventListener("timeupdate", () => {
  const d = el.video.duration || 0;
  const t = el.video.currentTime || 0;

  el.timeNow.textContent = fmtTime(t);
  el.timeDur.textContent = fmtTime(d);

  if (d > 0) {
    const r = Math.max(0, Math.min(1, t / d));
    el.seek.value = String(Math.floor(r * 1000));
  }
});

/* ---------- Boot ---------- */

async function loadLibrary(){
  // cache-bust library fetch too
  const url = `videos/library.json?v=${Date.now()}`;

  try{
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("library.json must be an array");
    library = data;

    renderGrid();

    // choose episode by ?v=RID if present
    const params = new URLSearchParams(location.search);
    const rid = params.get("v");
    const idx = rid ? library.findIndex(x => x.rid === rid) : -1;

    currentIndex = idx >= 0 ? idx : 0;
    loadVideo(library[currentIndex], false);
  } catch(err){
    el.epTitle.textContent = "Could not load playlist (videos/library.json).";
    setTicker(String(err));
    console.error(err);
  }
}

loadLibrary();
