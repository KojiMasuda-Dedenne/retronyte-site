const video = document.getElementById("video");
const overlay = document.getElementById("playOverlay");
const frame = document.querySelector(".player-frame");
const playBtn = document.getElementById("playBtn");
const seek = document.getElementById("seek");
const library = document.getElementById("library");

const videos = [
  {
    title: "Is Greninja ex Actually That Good?",
    src: "https://ia600607.us.archive.org/24/items/is-greninja-ex-actually-that-good/Is%20Greninja%20ex%20Actually%20That%20Good_.mp4"
  },
  {
    title: "I HATED Crabominable until THIS!",
    src: "https://archive.org/download/i-hated-crabominable-until-this/I%20HATED%20Crabominable%20until%20THIS!.mp4"
  }
];

/* BOOT */
setTimeout(()=>{
  document.body.classList.remove("booting");
  document.getElementById("boot").remove();
  document.getElementById("app").hidden = false;
}, 2600);

/* PLAYER */
function loadVideo(v){
  video.pause();
  video.src = v.src;
  video.load();
  overlay.style.display = "flex";
  frame.classList.remove("playing");
}

overlay.onclick = ()=>{
  video.play();
};

video.onplay = ()=>{
  overlay.style.display = "none";
  frame.classList.add("playing");
};

video.onpause = ()=>{
  overlay.style.display = "flex";
  frame.classList.remove("playing");
};

video.ontimeupdate = ()=>{
  seek.value = (video.currentTime / video.duration) * 100 || 0;
};

seek.oninput = ()=>{
  video.currentTime = (seek.value / 100) * video.duration;
};

playBtn.onclick = ()=>{
  video.paused ? video.play() : video.pause();
};

/* LIBRARY */
videos.forEach(v=>{
  const b = document.createElement("button");
  b.textContent = v.title;
  b.onclick = ()=>loadVideo(v);
  library.appendChild(b);
});

/* LOAD FIRST */
loadVideo(videos[0]);
