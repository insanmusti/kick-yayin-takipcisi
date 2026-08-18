document.addEventListener("DOMContentLoaded", () => {
  loadChannels();
  chrome.runtime.sendMessage({ action: "updateBadge" });

  const addChannelBtn = document.getElementById("add-channel-btn");
  const channelInput = document.getElementById("channel-input");

  if (addChannelBtn && channelInput) {
    addChannelBtn.addEventListener("click", () => {
      const channelName = channelInput.value.trim().toLowerCase();
      if (channelName) {
        addChannel(channelName);
        channelInput.value = "";
      }
    });

    channelInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addChannelBtn.click();
      }
    });
  }
});

async function loadChannels() {
  const container = document.getElementById("channel-list");
  if (!container) return;

  const data = await chrome.storage.local.get(["channels"]);
  const channels = data.channels || [];

  // innerHTML yerine textContent ile temizleme yapılıyor
  container.textContent = "";

  if (channels.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-msg";
    emptyDiv.textContent = "Henüz bir kanal eklemediniz.";
    container.appendChild(emptyDiv);
    return;
  }

  const channelPromises = channels.map(async (channelName) => {
    try {
      const response = await fetch(`https://kick.com/api/v1/channels/${channelName}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const result = await response.json();
        return { name: channelName, data: result, error: false };
      }
    } catch (e) {
      console.error(`${channelName} verisi alınamadı:`, e);
    }
    return { name: channelName, data: null, error: true };
  });

  const results = await Promise.all(channelPromises);

  results.forEach((item) => {
    renderChannelCard(container, item);
  });
}

async function addChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  if (!channels.includes(channelName)) {
    channels.push(channelName);
    await chrome.storage.local.set({ channels });
    loadChannels();
    chrome.runtime.sendMessage({ action: "updateBadge" });
  }
}

async function removeChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  channels = channels.filter((name) => name !== channelName);
  await chrome.storage.local.set({ channels });
  loadChannels();
  chrome.runtime.sendMessage({ action: "updateBadge" });
}

// Kartlar innerHTML yerine güvenli createElement ve textContent ile oluşturuluyor
function renderChannelCard(container, item) {
  const card = document.createElement("div");
  card.className = "channel-card";

  if (item.error || !item.data) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "channel-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "channel-name";
    nameSpan.textContent = item.name;

    const statusSpan = document.createElement("span");
    statusSpan.className = "status offline";
    statusSpan.textContent = "Hata / Bulunamadı";

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(statusSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Sil";
    deleteBtn.addEventListener("click", () => removeChannel(item.name));

    card.appendChild(infoDiv);
    card.appendChild(deleteBtn);
  } else {
    const isLive = item.data.livestream !== null;
    const viewers = isLive ? item.data.livestream.viewer_count : 0;
    const avatarUrl = item.data.user?.profile_pic || "../icon/icon.png";

    const leftDiv = document.createElement("div");
    leftDiv.className = "channel-left";

    const avatarImg = document.createElement("img");
    avatarImg.className = "avatar";
    avatarImg.src = avatarUrl;
    avatarImg.alt = item.name;

    const detailsDiv = document.createElement("div");
    detailsDiv.className = "channel-details";

    const channelLink = document.createElement("a");
    channelLink.href = `https://kick.com/${item.name}`;
    channelLink.target = "_blank";
    channelLink.className = "channel-name";
    channelLink.textContent = item.name;

    const statusSpan = document.createElement("span");
    statusSpan.className = `status ${isLive ? "live" : "offline"}`;
    statusSpan.textContent = isLive ? `🔴 Canlı (${viewers} izleyici)` : "Çevrimdışı";

    detailsDiv.appendChild(channelLink);
    detailsDiv.appendChild(statusSpan);

    leftDiv.appendChild(avatarImg);
    leftDiv.appendChild(detailsDiv);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Sil";
    deleteBtn.addEventListener("click", () => removeChannel(item.name));

    card.appendChild(leftDiv);
    card.appendChild(deleteBtn);
  }

  container.appendChild(card);
}