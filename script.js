// Auto-load latest video ID from JSON
fetch("videos/latest.json")
  .then(res => res.json())
  .then(data => {
    document.getElementById("video-frame").src =
      `https://www.youtube.com/embed/${data.id}`;
  })
  .catch(() => {
    document.getElementById("video-frame").src =
      "https://www.youtube.com/embed/6P1H8zzywiI"; // fallback video
  });
