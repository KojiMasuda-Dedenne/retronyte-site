const el = {
  video: document.getElementById("video"),
  overlayPlay: document.getElementById("overlayPlay"),
  btnPlay: document.getElementById("btnPlay"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  btnFs: document.getElementById("btnFs"),
  seek: document.getElementById("seek"),
  vol: document.getElementById("vol"),
  time: document.getElementById("time"),
  title: document.getElementById("title"),
  ridPill: document.getElementById("ridPill"),
  grid: document.getElementById("grid"),
};

let LIB = [];
let idx = 0;
let seeking = false;

function fmtTime(s){
  if (!isFinite(s)) return "0:00";
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}

function setPlayingUI(isPlaying){
  document.body.classList.toggle("is-playing", !!isPlaying);
}

function setURL(rid){
  const u = new URL(window.location.href);
  u.searchParams.set("v", rid);
  history.replaceState({}, "", u.toString());
}

function loadVideoByIndex(i, autoplay=false){
  if (!LIB.length) return;

  idx = (i + LIB.length) % LIB.length;
  const v = LIB[idx];

  if (!v || !v.src){
    el.title.textContent = "Missing video src in videos/library.json";
    el.ridPill.textContent = "RID: —";
    return;
  }

  // update UI text (no “Internet Archive” anywhere)
  el.title.textContent = v.title || "Retronyte Episode";
  el.ridPill.textContent = `RID: ${v.rid || "—"}`;

  // poster
  el.video.poster = v.poster || "";

  // stop -> set source -> load
  setPlayingUI(false);
  el.video.pause();
  el.video.src = v.src;
  el.video.load();

  // update URL param
  if (v.rid) setURL(v.rid);

  // autoplay optional
  if (autoplay){
    el.video.play().catch(()=>{});
  }
}

function currentRIDFromURL(){
  const u = new URL(window.location.href);
  return u.searchParams.get("v");
}

function renderGrid(){
  el.grid.innerHTML = "";
  LIB.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p class="card-title">${v.title || "Untitled"}</p>
      <p class="card-rid">RID: ${v.rid || "—"}</p>
    `;
    card.addEventListener("click", () => loadVideoByIndex(i, true));
    el.grid.appendChild(card);
  });
}

async function loadLibrary(){
  // cache-bust the JSON so GitHub Pages updates faster
  const res = await fetch(`videos/library.json?cb=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to load videos/library.json");
  const data = await res.json();

  if (!Array.isArray(data)) throw new Error("library.json must be an array");
  LIB = data;

  renderGrid();

  // choose initial based on URL
  const rid = currentRIDFromURL();
  const found = rid ? LIB.findIndex(x => x.rid === rid) : -1;
  loadVideoByIndex(found >= 0 ? found : 0, false);
}

function bindControls(){
  el.overlayPlay.addEventListener("click", () => {
    el.video.play().catch(()=>{});
  });

  el.btnPlay.addEventListener("click", () => {
    if (el.video.paused) el.video.play().catch(()=>{});
    else el.video.pause();
  });

  el.btnPrev.addEventListener("click", () => loadVideoByIndex(idx - 1, true));
  el.btnNext.addEventListener("click", () => loadVideoByIndex(idx + 1, true));

  el.vol.addEventListener("input", () => {
    el.video.volume = Number(el.vol.value || 0.85);
  });
  el.video.volume = Number(el.vol.value || 0.85);

  el.seek.addEventListener("input", () => {
    seeking = true;
  });
  el.seek.addEventListener("change", () => {
    const t = (Number(el.seek.value) / 1000) * (el.video.duration || 0);
    if (isFinite(t)) el.video.currentTime = t;
    seeking = false;
  });

  el.btnFs.addEventListener("click", () => {
    const stage = document.getElementById("stage");
    if (!document.fullscreenElement){
      stage.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // video events
  el.video.addEventListener("play", () => setPlayingUI(true));
  el.video.addEventListener("pause", () => setPlayingUI(false));
  el.video.addEventListener("ended", () => {
    setPlayingUI(false);
    // auto-next feels arcade
    loadVideoByIndex(idx + 1, true);
  });

  el.video.addEventListener("timeupdate", () => {
    const cur = el.video.currentTime || 0;
    const dur = el.video.duration || 0;
    el.time.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;

    if (!seeking && dur > 0){
      el.seek.value = String(Math.floor((cur / dur) * 1000));
    }
  });
}

(async function init(){
  bindControls();
  try{
    await loadLibrary();
  }catch(err){
    console.error(err);
    el.title.textContent = "Could not load playlist (videos/library.json).";
  }
})();
