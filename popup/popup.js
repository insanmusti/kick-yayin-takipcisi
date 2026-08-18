document.addEventListener("DOMContentLoaded", () => {
  loadChannels();
  
  // Pop-up açıldığında arka plandaki rozeti güncellemek için mesaj gönder
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

// Kanalları paralel (eşzamanlı) ve hızlı şekilde yükleyen ana fonksiyon
async function loadChannels() {
  const container = document.getElementById("channel-list");
  if (!container) return;

  const data = await chrome.storage.local.get(["channels"]);
  const channels = data.channels || [];

  if (channels.length === 0) {
    container.innerHTML = `<div class="empty-msg">Henüz bir kanal eklemediniz.</div>`;
    return;
  }

  // İstekleri sırayla beklemek yerine Promise.all ile HIZLI (paralel) çekiyoruz
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
  
  // Arayüzü temizle ve kartları çizdir
  container.innerHTML = "";
  results.forEach((item) => {
    renderChannelCard(container, item);
  });
}

// Kanal ekleme işlemi
async function addChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  if (!channels.includes(channelName)) {
    channels.push(channelName);
    await chrome.storage.local.set({ channels });
    loadChannels();
    // Arka plana rozeti güncellemesi için haber ver
    chrome.runtime.sendMessage({ action: "updateBadge" });
  }
}

// Kanal silme işlemi
async function removeChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  channels = channels.filter((name) => name !== channelName);
  await chrome.storage.local.set({ channels });
  loadChannels();
  // Arka plana rozeti güncellemesi için haber ver
  chrome.runtime.sendMessage({ action: "updateBadge" });
}

// Kanal kartını ekrana basan fonksiyon
function renderChannelCard(container, item) {
  const card = document.createElement("div");
  card.className = "channel-card";

  if (item.error || !item.data) {
    card.innerHTML = `
      <div class="channel-info">
        <span class="channel-name">${item.name}</span>
        <span class="status offline">Hata / Bulunamadı</span>
      </div>
      <button class="delete-btn" data-name="${item.name}">Sil</button>
    `;
  } else {
    const isLive = item.data.livestream !== null;
    const viewers = isLive ? item.data.livestream.viewer_count : 0;
    const avatar = item.data.user?.profile_pic || "../icon/icon.png";

    card.innerHTML = `
      <div class="channel-left">
        <img src="${avatar}" class="avatar" alt="${item.name}" />
        <div class="channel-details">
          <a href="https://kick.com/${item.name}" target="_blank" class="channel-name">${item.name}</a>
          <span class="status ${isLive ? "live" : "offline"}">
            ${isLive ? `🔴 Canlı (${viewers} izleyici)` : "Çevrimdışı"}
          </span>
        </div>
      </div>
      <button class="delete-btn" data-name="${item.name}">Sil</button>
    `;
  }

  // Silme butonuna tıklama olayı
  const deleteBtn = card.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    removeChannel(item.name);
  });

  container.appendChild(card);
}