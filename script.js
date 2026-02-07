const video = document.getElementById("video");
const titleEl = document.getElementById("title");
const ridEl = document.getElementById("ridPill");
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");

let library = [];
let index = 0;

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function loadVideo(v, autoplay = false) {
  if (!v || !v.src) {
    setStatus("⚠ Missing video src in library.json");
    return;
  }

  setStatus("");

  video.pause();
  video.removeAttribute("src");   // forces a true reload
  video.load();

  video.src = v.src;
  if (v.poster) video.poster = v.poster;

  titleEl.textContent = v.title || "Retronyte Episode";
  ridEl.textContent = `RID: ${v.rid || "—"}`;

  video.load();

  if (autoplay) {
    video.play().catch(() => {});
  }
}

function renderGrid() {
  grid.innerHTML = "";
  library.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-title">${v.title || "Untitled Episode"}</div>
      <div class="card-rid">RID: ${v.rid || "—"}</div>
    `;
    card.addEventListener("click", () => {
      index = i;
      loadVideo(v, true);
    });
    grid.appendChild(card);
  });
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return await res.json();
}

(async function init() {
  setStatus("Loading playlist…");

  try {
    // Try the correct folder path first
    library = await fetchJSON("videos/library.json");

  } catch (e1) {
    console.warn(e1);

    try {
      // Fallback: if you accidentally put it in root
      library = await fetchJSON("library.json");

    } catch (e2) {
      console.error(e2);
      setStatus("❌ Could not load library.json. Make sure it is at /videos/library.json");
      titleEl.textContent = "No playlist found";
      return;
    }
  }

  if (!Array.isArray(library) || library.length === 0) {
    setStatus("⚠ library.json loaded but is empty.");
    titleEl.textContent = "Playlist is empty";
    return;
  }

  setStatus("");
  renderGrid();
  loadVideo(library[0], false);
})();
