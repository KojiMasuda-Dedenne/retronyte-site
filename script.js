async function loadLatestVideo() {
  try {
    const res = await fetch("videos/latest.json");
    const data = await res.json();
    const wrapper = document.getElementById("video-wrapper");
    const ticker = document.getElementById("now-playing");

    if (data.source === "streamable") {
      wrapper.innerHTML = `
        <iframe
          src="https://streamable.com/e/${data.id}"
          frameborder="0"
          allowfullscreen
          style="position:absolute;top:0;left:0;width:100%;height:100%;">
        </iframe>`;
      ticker.textContent = `🎵 Now Playing: ${data.title}`;
    } else {
      wrapper.innerHTML = "<p>⚠️ No Streamable video found.</p>";
    }
  } catch (err) {
    console.error("Error loading latest video:", err);
    document.getElementById("video-wrapper").innerHTML =
      "<p>⚠️ Could not load latest episode.</p>";
  }
}

loadLatestVideo();
