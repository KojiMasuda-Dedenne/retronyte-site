/* Retronyte Player
   - loads /videos/library.json
   - query param ?v=RID
   - native controls only (no overlays)
   - spacebar toggles play/pause (when not typing)
*/

const el = {
  video: document.getElementById("video"),
  nowTitle: document.getElementById("nowTitle"),
  ridPill: document.getElementById("ridPill"),
  grid: document.getElementById("grid"),
  cardTitleText: document.getElementById("cardTitleText"),
};

function getParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

function setURL(rid) {
  const u = new URL(location.href);
  if (rid) u.searchParams.set("v", rid);
  history.replaceState({}, "", u.toString());
}

async function loadLibrary() {
  // IMPORTANT: must be exactly /videos/library.json in your repo
  const res = await fetch("./videos/library.json?v=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load playlist (videos/library.json).");
  return await res.json();
}

function pickInitial(library) {
  const rid = getParam("v");
  if (rid) {
    const found = library.find(x => x.rid === rid);
    if (found) return found;
  }
  return library[0] || null;
}

function applyVideo(v, autoplay = false) {
  if (!v) return;

  // Update meta
  el.nowTitle.textContent = v.title || "Retronyte Episode";
  el.ridPill.textContent = `RID: ${v.rid || "—"}`;
  el.cardTitleText.textContent = "Retronyte Online";

  // Set source + poster
  el.video.pause();
  el.video.src = v.src;
  el.video.poster = v.poster || "";
  el.video.load();

  setURL(v.rid);

  if (autoplay) {
    el.video.play().catch(() => {});
  }
}

function renderGrid(library, currentRid) {
  el.grid.innerHTML = "";

  for (const v of library) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = `./?v=${encodeURIComponent(v.rid)}`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      applyVideo(v, true);
      renderGrid(library, v.rid);
    });

    const t = document.createElement("p");
    t.className = "tileTitle";
    t.textContent = v.title;

    const r = document.createElement("p");
    r.className = "tileRid";
    r.textContent = `RID: ${v.rid}`;

    a.appendChild(t);
    a.appendChild(r);

    // simple current highlight
    if (v.rid === currentRid) {
      a.style.borderColor = "rgba(255, 59, 212, .55)";
    }

    el.grid.appendChild(a);
  }
}

function bindKeyboard() {
  window.addEventListener("keydown", (e) => {
    // Don't hijack typing
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    // Space toggles play/pause
    if (e.code === "Space") {
      e.preventDefault();
      if (el.video.paused) el.video.play().catch(() => {});
      else el.video.pause();
    }
  });
}

(async function init() {
  try {
    bindKeyboard();

    const library = await loadLibrary();
    const first = pickInitial(library);

    if (!first) {
      el.nowTitle.textContent = "No episodes in library.json";
      return;
    }

    applyVideo(first, false);
    renderGrid(library, first.rid);
  } catch (err) {
    el.nowTitle.textContent = err.message || "Failed to load.";
    console.error(err);
  }
})();
