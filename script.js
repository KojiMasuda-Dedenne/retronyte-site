const el = {
  stage: document.getElementById("stage"),
  video: document.getElementById("video"),
  overlayPlay: document.getElementById("overlayPlay"),

  title: document.getElementById("title"),
  ridPill: document.getElementById("ridPill"),

  btnPrev: document.getElementById("btnPrev"),
  btnPlay: document.getElementById("btnPlay"),
  btnNext: document.getElementById("btnNext"),

  tCur: document.getElementById("tCur"),
  tDur: document.getElementById("tDur"),
  seek: document.getElementById("seek"),
  vol: document.getElementById("vol"),

  grid: document.getElementById("grid")
};

let library = [];
let idx = 0;
let isSeeking = false;

function fmtTime(s){
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s/60);
  const r = Math.floor(s%60).toString().padStart(2,"0");
  return `${m}:${r}`;
}

function setPlayingUI(isPlaying){
  el.stage.classList.toggle("playing", !!isPlaying);
}

function getRidFromUrl(){
  const p = new URLSearchParams(location.search);
  return p.get("v");
}

function setUrlRid(rid){
  const p = new URLSearchParams(location.search);
  p.set("v", rid);
  history.replaceState({}, "", `${location.pathname}?${p.toString()}`);
}

function loadVideo(v, autoplay=false){
  if (!v || !v.src) return;

  el.video.pause();
  setPlayingUI(false);

  el.video.src = v.src;
  if (v.poster) el.video.poster = v.poster;

  el.title.textContent = v.title || "Retronyte Player";
  el.ridPill.textContent = `RID: ${v.rid || "—"}`;

  setUrlRid(v.rid || "latest");

  el.video.load();
  if (autoplay) el.video.play().catch(()=>{});
}

function renderGrid(){
  el.grid.innerHTML = "";
  for (let i=0;i<library.length;i++){
    const v = library[i];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${v.title || v.rid}</div>
      <div class="card-rid">RID: ${v.rid}</div>
    `;
    card.addEventListener("click", ()=>{
      idx = i;
      loadVideo(library[idx], true);
    });
    el.grid.appendChild(card);
  }
}

function prev(){
  if (!library.length) return;
  idx = (idx - 1 + library.length) % library.length;
  loadVideo(library[idx], true);
}
function next(){
  if (!library.length) return;
  idx = (idx + 1) % library.length;
  loadVideo(library[idx], true);
}
function togglePlay(){
  if (el.video.paused) el.video.play().catch(()=>{});
  else el.video.pause();
}

async function boot(){
  // load playlist
  const res = await fetch("videos/library.json", { cache: "no-store" });
  library = await res.json();

  // choose episode by URL
  const rid = getRidFromUrl();
  if (rid){
    const found = library.findIndex(x => x.rid === rid);
    if (found >= 0) idx = found;
  }

  renderGrid();
  loadVideo(library[idx], false);

  // events
  el.overlayPlay.addEventListener("click", ()=> el.video.play().catch(()=>{}));
  el.btnPrev.addEventListener("click", prev);
  el.btnNext.addEventListener("click", next);
  el.btnPlay.addEventListener("click", togglePlay);

  el.vol.addEventListener("input", ()=> el.video.volume = parseFloat(el.vol.value));

  el.video.addEventListener("play", ()=> setPlayingUI(true));
  el.video.addEventListener("pause", ()=> setPlayingUI(false));
  el.video.addEventListener("ended", ()=> { setPlayingUI(false); next(); });

  el.video.addEventListener("loadedmetadata", ()=>{
    el.tDur.textContent = fmtTime(el.video.duration);
  });

  el.video.addEventListener("timeupdate", ()=>{
    if (!isSeeking){
      el.tCur.textContent = fmtTime(el.video.currentTime);
      const d = el.video.duration || 0;
      el.seek.value = d ? Math.floor((el.video.currentTime/d)*1000) : 0;
    }
  });

  el.seek.addEventListener("input", ()=>{
    isSeeking = true;
  });

  el.seek.addEventListener("change", ()=>{
    const d = el.video.duration || 0;
    const pct = parseInt(el.seek.value, 10) / 1000;
    if (d) el.video.currentTime = d * pct;
    isSeeking = false;
  });

  // keyboard
  window.addEventListener("keydown", (e)=>{
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    const inInput = tag === "INPUT" || tag === "TEXTAREA";
    if (inInput) return;

    if (e.code === "Space"){
      e.preventDefault();
      togglePlay();
    }
    if (e.code === "ArrowRight") { e.preventDefault(); el.video.currentTime += 5; }
    if (e.code === "ArrowLeft") { e.preventDefault(); el.video.currentTime -= 5; }
    if (e.code === "KeyN") next();
    if (e.code === "KeyP") prev();
  });
}

boot().catch(err=>{
  console.error(err);
  el.title.textContent = "Could not load playlist (videos/library.json).";
});
