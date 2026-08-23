document.addEventListener("DOMContentLoaded", async () => {
  await restoreTheme();
  setupTabs();
  setupThemeGrid();
  setupSuggestionsToggle();
  loadChannels();
  chrome.runtime.sendMessage({ action: "updateBadge" });

  const addChannelBtn = document.getElementById("add-channel-btn");
  const channelInput = document.getElementById("channel-input");

  if (addChannelBtn && channelInput) {
    addChannelBtn.addEventListener("click", async () => {
      const channelName = channelInput.value.trim().toLowerCase();
      if (channelName) {
        await addChannel(channelName);
        channelInput.value = "";
      }
    });

    channelInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const channelName = channelInput.value.trim().toLowerCase();
        if (channelName) {
          await addChannel(channelName);
          channelInput.value = "";
        }
      }
    });
  }
});

function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === tab.dataset.panel);
      });
    });
  });
}

async function setupThemeGrid() {
  const grid = document.getElementById("theme-grid");
  if (!grid) return;

  const currentTheme = await getSavedTheme();

  Object.entries(THEMES).forEach(([id, theme]) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option" + (id === currentTheme ? " selected" : "");

    const swatch = document.createElement("span");
    swatch.className = "theme-swatch";
    theme.swatch.forEach((color) => {
      const dot = document.createElement("span");
      dot.style.backgroundColor = color;
      swatch.appendChild(dot);
    });

    const nameSpan = document.createElement("span");
    nameSpan.className = "theme-name";
    nameSpan.textContent = theme.label;

    const check = document.createElement("span");
    check.className = "theme-check";
    check.textContent = id === currentTheme ? "\u2713" : "";

    option.appendChild(swatch);
    option.appendChild(nameSpan);
    option.appendChild(check);

    option.addEventListener("click", async () => {
      applyTheme(id);
      await saveTheme(id);
      grid.querySelectorAll(".theme-option").forEach((el) => {
        el.classList.remove("selected");
        const c = el.querySelector(".theme-check");
        if (c) c.textContent = "";
      });
      option.classList.add("selected");
      check.textContent = "\u2713";
    });

    grid.appendChild(option);
  });
}

async function loadChannels() {
  const container = document.getElementById("channel-list");
  if (!container) return;

  const data = await chrome.storage.local.get(["channels"]);
  const channels = data.channels || [];

  container.textContent = "";

  if (channels.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-msg";
    emptyDiv.textContent = "Henüz bir kanal eklemediniz.";
    container.appendChild(emptyDiv);
    renderSuggestions();
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

  container.textContent = "";
  results.forEach((item) => {
    renderChannelCard(container, item);
  });

  renderSuggestions();
}

async function setupSuggestionsToggle() {
  const toggle = document.getElementById("toggle-suggestions");
  if (!toggle) return;

  const prefs = await getSuggestionPrefs();
  toggle.checked = prefs.showSuggestions;

  toggle.addEventListener("change", async () => {
    await setShowSuggestions(toggle.checked);
    renderSuggestions();
  });
}

async function renderSuggestions() {
  const section = document.getElementById("suggested-section");
  const container = document.getElementById("suggested-list");
  if (!section || !container) return;

  const prefs = await getSuggestionPrefs();
  const data = await chrome.storage.local.get(["channels"]);
  const channels = data.channels || [];

  const visible = prefs.showSuggestions
    ? SUGGESTED_CHANNELS.filter(
        (name) => !channels.includes(name) && !prefs.dismissedSuggestions.includes(name)
      )
    : [];

  if (visible.length === 0) {
    section.classList.add("hidden");
    container.textContent = "";
    return;
  }

  section.classList.remove("hidden");

  const requests = visible.map(async (name) => {
    try {
      const response = await fetch(`https://kick.com/api/v1/channels/${name}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const result = await response.json();
        return { name: name, data: result };
      }
    } catch (e) {
      console.error(`${name} önerisi alınamadı:`, e);
    }
    return { name: name, data: null };
  });

  const results = await Promise.all(requests);

  container.textContent = "";
  results.forEach((item) => {
    renderSuggestionCard(container, item);
  });
}

function renderSuggestionCard(container, item) {
  const isLive = item.data && item.data.livestream !== null;
  const viewers = isLive ? item.data.livestream.viewer_count : 0;
  const avatarUrl = item.data?.user?.profile_pic || "../icon/icon.png";

  const card = document.createElement("div");
  card.className = "channel-card";

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
  channelLink.title = `kick.com/${item.name}`;
  channelLink.textContent = item.name;

  const statusSpan = document.createElement("span");
  statusSpan.className = `status ${isLive ? "live" : "offline"}`;
  statusSpan.textContent = item.data
    ? isLive
      ? `🔴 Canlı (${viewers} izleyici)`
      : "Çevrimdışı"
    : "Yüklenemedi";

  detailsDiv.appendChild(channelLink);
  detailsDiv.appendChild(statusSpan);
  leftDiv.appendChild(avatarImg);
  leftDiv.appendChild(detailsDiv);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "suggest-actions";

  const addBtn = document.createElement("button");
  addBtn.className = "suggest-add-btn";
  addBtn.textContent = "+ Ekle";
  addBtn.addEventListener("click", async () => {
    addBtn.disabled = true;
    await addChannel(item.name);
    renderSuggestions();
  });

  const dismissBtn = document.createElement("button");
  dismissBtn.className = "suggest-dismiss";
  dismissBtn.textContent = "\u00d7";
  dismissBtn.title = "Bu öneriyi kapat";
  dismissBtn.addEventListener("click", async () => {
    await dismissSuggestion(item.name);
    renderSuggestions();
  });

  actionsDiv.appendChild(addBtn);
  actionsDiv.appendChild(dismissBtn);

  card.appendChild(leftDiv);
  card.appendChild(actionsDiv);
  container.appendChild(card);
}

async function addChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  if (!channels.includes(channelName)) {
    channels.push(channelName);
    // Verinin tamamen kaydedilmesini kesin olarak bekliyoruz
    await chrome.storage.local.set({ channels: channels });
    // Kayıt tamamlandıktan sonra güncel listeyi yüklüyoruz
    await loadChannels();
    chrome.runtime.sendMessage({ action: "updateBadge" });
  }
}

async function removeChannel(channelName) {
  const data = await chrome.storage.local.get(["channels"]);
  let channels = data.channels || [];

  channels = channels.filter((name) => name !== channelName);
  await chrome.storage.local.set({ channels: channels });
  await loadChannels();
  chrome.runtime.sendMessage({ action: "updateBadge" });
}

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
    statusSpan.textContent = "Çevrimdışı / Yüklenemedi";

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