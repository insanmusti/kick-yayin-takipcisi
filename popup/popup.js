const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

document.addEventListener("DOMContentLoaded", async () => {
  const streamerInput = document.getElementById("streamerInput");
  const addBtn = document.getElementById("addBtn");
  const streamerList = document.getElementById("streamerList");
  const liveCounter = document.getElementById("liveCounter");

  async function fetchChannelStatus(username) {
    try {
      const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.livestream) {
          return { isLive: true, viewers: data.livestream.viewer_count || 0 };
        }
      }
    } catch (err) {
      console.error(err);
    }
    return { isLive: false, viewers: 0 };
  }

  async function loadData() {
    const store = await extensionAPI.storage.local.get(["streamers"]);
    const list = store.streamers || [];
    await renderUI(list);
  }

  async function renderUI(streamers) {
    streamerList.innerHTML = "";

    if (streamers.length === 0) {
      streamerList.innerHTML = "<li class='streamer-item empty'>Takip listeniz boş.</li>";
      liveCounter.textContent = "0 Yayın Açık";
      return;
    }

    let activeCount = 0;

    for (const user of streamers) {
      const status = await fetchChannelStatus(user);
      if (status.isLive) activeCount++;

      const li = document.createElement("li");
      li.className = "streamer-item";

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "streamer-details";
      detailsDiv.addEventListener("click", () => {
        extensionAPI.tabs.create({ url: `https://kick.com/${user}` });
      });

      const nameEl = document.createElement("span");
      nameEl.className = "streamer-name";
      nameEl.textContent = user;

      const tagEl = document.createElement("span");
      tagEl.className = `status-tag ${status.isLive ? 'online' : ''}`;
      tagEl.textContent = status.isLive ? `${status.viewers.toLocaleString()} izleyici` : "Çevrimdışı";

      detailsDiv.appendChild(nameEl);
      detailsDiv.appendChild(tagEl);

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "Sil";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeUser(user);
      });

      li.appendChild(detailsDiv);
      li.appendChild(delBtn);
      streamerList.appendChild(li);
    }

    liveCounter.textContent = `${activeCount} Yayın Açık`;
  }

  async function addUser() {
    const name = streamerInput.value.trim().toLowerCase();
    if (!name) return;

    const store = await extensionAPI.storage.local.get(["streamers"]);
    const list = store.streamers || [];

    if (!list.includes(name)) {
      list.push(name);
      await extensionAPI.storage.local.set({ streamers: list });
      streamerInput.value = "";
      loadData();
      extensionAPI.runtime.sendMessage({ action: "refresh" });
    }
  }

  async function removeUser(name) {
    const store = await extensionAPI.storage.local.get(["streamers"]);
    let list = store.streamers || [];
    list = list.filter((item) => item !== name);

    await extensionAPI.storage.local.set({ streamers: list });
    loadData();
    extensionAPI.runtime.sendMessage({ action: "refresh" });
  }

  addBtn.addEventListener("click", addUser);
  streamerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addUser();
  });

  loadData();
});