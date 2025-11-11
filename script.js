async function loadLatestVideo() {
  try {
    // 👇 force fresh fetch so GitHub doesn't cache old JSON
    const res = await fetch("videos/latest.json?cacheBust=" + Date.now());
    const data = await res.json();

    const wrapper = document.getElementById("video-wrapper");
    const ticker = document.getElementById("now-playing");

    console.log("Loaded video data:", data); // debug output

    if (data.source === "streamable" && data.id) {
      wrapper.innerHTML = `
        <iframe
          src="https://streamable.com/e/${data.id}"
          frameborder="0"
          allowfullscreen
          style="position:absolute;top:0;left:0;width:100%;height:100%;">
        </iframe>`;
      ticker.textContent = `🎵 Now Playing: ${data.title || "Untitled Video"}`;
    } else {
      wrapper.innerHTML = "<p>⚙️ Streamable data missing or invalid.</p>";
      ticker.textContent = "⚙️ Unable to load Streamable video.";
    }
  } catch (err) {
    console.error("Error loading latest video:", err);
    document.getElementById("video-wrapper").innerHTML =
      "<p>⚠️ Could not load latest episode.</p>";
  }
}

// Run the function
loadLatestVideo();
