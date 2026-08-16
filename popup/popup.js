document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("usernameInput");
  const addBtn = document.getElementById("addBtn");
  const streamerList = document.getElementById("streamerList");

  loadStreamers();

  addBtn.addEventListener("click", async () => {
    const rawInput = usernameInput.value.trim().toLowerCase();
    const username = rawInput.replace(/[^a-z0-9_]/g, '');

    if (!username) return;

    const data = await browser.storage.local.get(["streamers"]);
    const streamers = data.streamers || [];

    if (!streamers.includes(username)) {
      streamers.push(username);
      await browser.storage.local.set({ streamers });
      usernameInput.value = "";
      loadStreamers();
      browser.runtime.sendMessage({ action: "refresh" });
    }
  });

  async function loadStreamers() {
    streamerList.textContent = "Yükleniyor...";
    const data = await browser.storage.local.get(["streamers"]);
    const streamers = data.streamers || [];

    if (streamers.length === 0) {
      streamerList.innerHTML = "<div style='color:#aaa; text-align:center; font-size:12px;'>Yayıncı eklenmedi.</div>";
      return;
    }

    streamerList.textContent = "";

    for (const username of streamers) {
      const card = document.createElement("div");
      card.className = "streamer-card";

      let isLive = false;
      let viewerCount = 0;

      try {
        const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`, {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.livestream !== null) {
            isLive = true;
            viewerCount = resData.livestream.viewer_count;
          }
        }
      } catch (e) {
        console.error(e);
      }

      const infoLink = document.createElement("a");
      infoLink.href = `https://kick.com/${username}`;
      infoLink.target = "_blank";
      infoLink.className = "streamer-info";

      const statusDot = document.createElement("span");
      statusDot.className = `status-dot ${isLive ? 'live' : ''}`;

      const textSpan = document.createElement("span");
      textSpan.textContent = username;

      infoLink.appendChild(statusDot);
      infoLink.appendChild(textSpan);

      if (isLive) {
        const viewerBadge = document.createElement("small");
        viewerBadge.style.color = "#53fc18";
        viewerBadge.style.marginLeft = "4px";
        viewerBadge.textContent = `(${viewerCount.toLocaleString()})`;
        infoLink.appendChild(viewerBadge);
      }

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "X";
      removeBtn.addEventListener("click", async () => {
        const currentData = await browser.storage.local.get(["streamers"]);
        const updatedList = (currentData.streamers || []).filter((u) => u !== username);
        await browser.storage.local.set({ streamers: updatedList });
        loadStreamers();
        browser.runtime.sendMessage({ action: "refresh" });
      });

      card.appendChild(infoLink);
      card.appendChild(removeBtn);
      streamerList.appendChild(card);
    }
  }
});