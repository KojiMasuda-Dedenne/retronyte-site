const video = document.getElementById("video");
const titleEl = document.getElementById("title");
const ridEl = document.getElementById("ridPill");
const grid = document.getElementById("grid");

let library = [];
let index = 0;

function loadVideo(v, autoplay=false) {
  video.pause();
  video.src = v.src;
  if (v.poster) video.poster = v.poster;

  titleEl.textContent = v.title || "Retronyte Episode";
  ridEl.textContent = `RID: ${v.rid || "—"}`;

  video.load();
  if (autoplay) video.play().catch(()=>{});
}

function renderGrid() {
  grid.innerHTML = "";
  library.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${v.title}</div>
      <div class="card-rid">RID: ${v.rid}</div>
    `;
    card.onclick = () => {
      index = i;
      loadVideo(v, true);
    };
    grid.appendChild(card);
  });
}

fetch("videos/library.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    library = data;
    renderGrid();
    loadVideo(library[0], false);
  })
  .catch(err => {
    console.error(err);
    titleEl.textContent = "Failed to load videos";
  });
