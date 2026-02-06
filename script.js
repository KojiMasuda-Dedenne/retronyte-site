const boot = document.getElementById("boot");
const app = document.getElementById("app");

const video = document.getElementById("video");
const overlayPlay = document.getElementById("overlay-play");
const playerShell = document.getElementById("player-shell");
const episodeList = document.getElementById("episode-list");

/* BOOT: NEVER AUTO REMOVES */
boot.addEventListener("click", () => {
  boot.remove();
  app.hidden = false;
});

/* LOAD EPISODES */
fetch("videos/library.json")
  .then(res => res.json())
  .then(data => {
    data.forEach(ep => {
      const div = document.createElement("div");
      div.className = "episode";
      div.textContent = ep.title;
      div.onclick = () => loadVideo(ep);
      episodeList.appendChild(div);
    });
    loadVideo(data[0]);
  });

function loadVideo(ep) {
  video.pause();
  video.src = ep.src;
  video.poster = ep.poster;
  video.load();
  overlayPlay.classList.remove("hidden");
  playerShell.classList.remove("playing");
}

overlayPlay.onclick = () => video.play();

video.addEventListener("play", () => {
  overlayPlay.classList.add("hidden");
  playerShell.classList.add("playing");
});

video.addEventListener("pause", () => {
  overlayPlay.classList.remove("hidden");
  playerShell.classList.remove("playing");
});
