(async () => {
  console.log("Retronyte script starting...");
  try {
    const response = await fetch("videos/latest.json?cache=" + Date.now());
    console.log("Fetch status:", response.status);
    const data = await response.json();
    console.log("Video data fetched:", data);

    const wrapper = document.getElementById("video-wrapper");
    const ticker  = document.getElementById("now-playing");

    if (!wrapper || !ticker) {
      console.error("Missing wrapper or ticker element");
      return;
    }

    if (data.source === "streamable" && data.id) {
      const iframeHTML = `
        <iframe
          src="https://streamable.com/e/${data.id}"
          frameborder="0"
          allowfullscreen
          style="width:100%;height:100%;border-radius:12px;">
        </iframe>`;
      wrapper.innerHTML = iframeHTML;
      ticker.textContent = `🎵 Now Playing: ${data.title || "Untitled"}`;
      console.log("Streamable iframe inserted.");
    } else {
      wrapper.innerHTML = "<p>⚙️ Invalid JSON format.</p>";
      console.warn("Invalid JSON structure:", data);
    }
  } catch (err) {
    console.error("Video load error:", err);
  }
})();
