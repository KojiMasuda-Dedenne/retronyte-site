const el = {
  video: document.getElementById("video"),
  overlayPlay: document.getElementById("overlayPlay"),
  ticker: document.getElementById("ticker"),
  title: document.getElementById("title"),
  ridPill: document.getElementById("ridPill"),
  grid: document.getElementById("grid"),
  insertBtn: document.getElementById("insertBtn"),
};

let library = [];
let current = null;

function setPlayingUI(isPlaying){
  document.body.classList.toggle("playing", !!isPlaying);
}

function setTicker(text){
  if(!el.ticker) return;
  el.ticker.innerHTML = `<span>${text}</span>`;
}

function getRidFromURL(){
  const url = new URL(window.location.href);
  return url.searchParams.get("v");
}

function setURL(rid){
  const url = new URL(window.location.href);
  url.searchParams.set("v", rid);
  history.replaceState({}, "", url.toString());
}

function loadVideo(v, autoplay=false){
  if(!v) return;
  current = v;

  setPlayingUI(false);

  el.video.pause();
  el.video.src = v.src;
  el.video.poster = v.poster || "";
  el.video.load();

  el.title.textContent = v.title || "Retronyte Episode";
  el.ridPill.textContent = `RID: ${v.rid}`;
  setTicker(`♪ Now Playing: ${v.title || v.rid}`);

  setURL(v.rid);

  if (autoplay){
    el.video.play().catch(()=>{});
  }
}

function renderGrid(){
  el.grid.innerHTML = "";
  library.forEach(v => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.innerHTML = `
      <div class="ctitle">${v.title}</div>
      <div class="crid">RID: ${v.rid}</div>
    `;
    card.addEventListener("click", ()=> loadVideo(v, true));
    el.grid.appendChild(card);
  });
}

async function boot(){
  // Insert cartridge collapses header (doesn't disappear)
  el.insertBtn?.addEventListener("click", ()=>{
    document.body.classList.add("boot-done");
    document.querySelector(".player-area")?.scrollIntoView({behavior:"smooth", block:"start"});
  });

  // overlay play
  el.overlayPlay?.addEventListener("click", ()=>{
    el.video.play().catch(()=>{});
  });

  // set playing state
  el.video.addEventListener("play", ()=> setPlayingUI(true));
  el.video.addEventListener("pause", ()=> setPlayingUI(false));
  el.video.addEventListener("ended", ()=>{
    setPlayingUI(false);
    const idx = library.findIndex(x => x.rid === current?.rid);
    if(idx >= 0 && library[idx+1]) loadVideo(library[idx+1], true);
  });

  // load library
  const res = await fetch("./videos/library.json?v=20260206b");
  const data = await res.json();
  library = data.videos || [];

  renderGrid();

  // load from URL or first
  const rid = getRidFromURL();
  const chosen = library.find(v => v.rid === rid) || library[0];
  loadVideo(chosen, false);
}

boot();
