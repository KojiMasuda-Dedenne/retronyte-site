(async () => {
  try {
    const res = await fetch("videos/latest.json?cb=" + Date.now());
    const data = await res.json();

    const wrapper = document.getElementById("video-wrapper");
    const ticker  = document.getElementById("now-playing");

    if (data.source === "streamable" && data.id) {
      wrapper.innerHTML = `
        <iframe src="https://streamable.com/e/${data.id}"
                frameborder="0" allowfullscreen
                title="${data.title || 'Retronyte Video'}"></iframe>`;
      ticker.textContent = `🎵 Now Playing: ${data.title || "Retronyte Episode"}`;
    } else {
      wrapper.innerHTML = "<p>⚙️ No playable video.</p>";
      ticker.textContent = "⚙️ Update videos/latest.json";
    }
  } catch (e) {
    console.error(e);
    document.getElementById("video-wrapper").innerHTML =
      "<p>⚠️ Could not load latest episode.</p>";
  }
})();
