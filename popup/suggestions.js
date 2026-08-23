const SUGGESTED_CHANNELS = ["mericb"];

async function getSuggestionPrefs() {
  try {
    const data = await chrome.storage.local.get(["showSuggestions", "dismissedSuggestions"]);
    return {
      showSuggestions: data.showSuggestions !== false,
      dismissedSuggestions: data.dismissedSuggestions || []
    };
  } catch (e) {
    console.error("Öneri ayarları okunamadı:", e);
    return { showSuggestions: true, dismissedSuggestions: [] };
  }
}

async function setShowSuggestions(enabled) {
  try {
    await chrome.storage.local.set({ showSuggestions: enabled });
  } catch (e) {
    console.error("Öneri ayarı kaydedilemedi:", e);
  }
}

async function dismissSuggestion(channelName) {
  try {
    const data = await chrome.storage.local.get(["dismissedSuggestions"]);
    const list = data.dismissedSuggestions || [];
    if (!list.includes(channelName)) {
      list.push(channelName);
      await chrome.storage.local.set({ dismissedSuggestions: list });
    }
  } catch (e) {
    console.error("Öneri kapatılamadı:", e);
  }
}
