const video = document.getElementById("video");
const stage = document.getElementById("stage");
const overlayPlay = document.getElementById("overlayPlay");
const titleEl = document.getElementById("title");
const ridEl = document.getElementById("ridPill");
const grid = document.getElementById("grid");

let library = [];
let idx = 0;

function setPlayingUI(isPlaying){
  stage.classList.toggle("is-playing", !!isPlaying);
}

function fmtTitle(v){
  return v.title || "Retronyte Episode";
}

function loadVideo(v, autoplay=false){
  if (!v || !v.src) return;

  video.pause();
  setPlayingUI(false);

  video.src = v.src;
  if (v.poster) video.poster = v.poster;

  titleEl.textContent = fmtTitle(v);
  ridEl.textContent = `RID: ${v.rid || "—"}`;

  video.load();
  if (autoplay) video.play().catch(()=>{});
}

function renderGrid(){
  grid.innerHTML = "";
  library.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${fmtTitle(v)}</div>
      <div class="card-rid">RID: ${v.rid || "—"}</div>
    `;
    card.addEventListener("click", () => {
      idx = i;
      loadVideo(library[idx], true);
    });
    grid.appendChild(card);
  });
}

async function boot(){
  const res = await fetch("videos/library.json", { cache: "no-store" });
  library = await res.json();

  if (!Array.isArray(library) || library.length === 0){
    titleEl.textContent = "No videos found in videos/library.json";
    return;
  }

  renderGrid();
  loadVideo(library[idx], false);

  overlayPlay.addEventListener("click", () => video.play().catch(()=>{}));

  video.addEventListener("play", () => setPlayingUI(true));
  video.addEventListener("pause", () => setPlayingUI(false));
  video.addEventListener("ended", () => setPlayingUI(false));

  // Spacebar toggle (unless typing)
  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;
    if (typing) return;

    if (e.code === "Space"){
      e.preventDefault();
      if (video.paused) video.play().catch(()=>{});
      else video.pause();
    }
  });
}

boot().catch(err => {
  console.error(err);
  titleEl.textContent = "Could not load playlist (videos/library.json).";
});
