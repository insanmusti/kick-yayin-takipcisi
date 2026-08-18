// Eklenti yüklendiğinde veya tarayıcı başladığında alarmları kur ve ilk kontrolü yap
chrome.runtime.onInstalled.addListener(() => {
  setupAlarm();
  checkStreamsAndSetBadge();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarm();
  checkStreamsAndSetBadge();
});

// Periyodik kontrol için 1 dakikalık alarm oluştur
function setupAlarm() {
  chrome.alarms.create("checkLiveStreams", { periodInMinutes: 1 });
}

// Alarm tetiklendiğinde otomatik çalış
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkLiveStreams") {
    checkStreamsAndSetBadge();
  }
});

// Pop-up açıldığında veya kanal eklendiğinde/silindiğinde gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    checkStreamsAndSetBadge();
  }
});

// Yayın durumlarını paralel (hızlı) sorgulayan ve rozeti güncelleyen ana fonksiyon
async function checkStreamsAndSetBadge() {
  try {
    const data = await chrome.storage.local.get(["channels"]);
    const channels = data.channels || [];

    if (channels.length === 0) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    // İstekleri tek tek beklemek yerine Promise.all ile paralel atıyoruz (Hız artışı sağlar)
    const requests = channels.map(async (channel) => {
      try {
        const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
          cache: "no-store"
        });
        if (response.ok) {
          const result = await response.json();
          return result.livestream !== null ? 1 : 0;
        }
      } catch (e) {
        console.error(`${channel} kontrol edilemedi:`, e);
      }
      return 0;
    });

    const results = await Promise.all(requests);
    const liveCount = results.reduce((acc, curr) => acc + curr, 0);

    // Rozet metnini ve stilini güncelle
    if (liveCount > 0) {
      chrome.action.setBadgeText({ text: liveCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#53FC18" });
      chrome.action.setBadgeTextColor({ color: "#000000" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.error("Rozet güncelleme hatası:", error);
  }
}