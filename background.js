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
  if (request.action === "testNotification") {
    sendTestNotification();
  }
});

// Bildirime tıklanınca yayını yeni sekmede aç ve bildirimi kaldır
chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith("kick-live-")) return;
  const channel = notificationId.slice("kick-live-".length).replace(/-\d+$/, "");
  chrome.notifications.clear(notificationId);
  if (channel) {
    chrome.tabs.create({ url: `https://kick.com/${channel}` });
  }
});

// Yayın durumlarını paralel (hızlı) sorgulayan, rozeti güncelleyen ve bildirim gönderen ana fonksiyon
async function checkStreamsAndSetBadge() {
  try {
    const data = await chrome.storage.local.get(["channels", "liveStates", "notificationsEnabled"]);
    const channels = data.channels || [];
    const liveStates = data.liveStates || {};
    const notificationsEnabled = data.notificationsEnabled !== false;

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
          return { channel, ok: true, isLive: result.livestream !== null, result };
        }
      } catch (e) {
        console.error(`${channel} kontrol edilemedi:`, e);
      }
      return { channel, ok: false, isLive: null, result: null };
    });

    const results = await Promise.all(requests);

    const newLiveStates = {};
    for (const item of results) {
      // Sorgu başarısızsa eski durumu koru (yanlış bildirim engellenir)
      if (!item.ok) {
        newLiveStates[item.channel] = item.channel in liveStates ? liveStates[item.channel] : false;
        continue;
      }

      newLiveStates[item.channel] = item.isLive;

      // Durumlar kapalıyken de güncellenir ki anahtar tekrar açıldığında
      // birikmiş yanlış bildirimler patlamasın
      if (item.isLive && liveStates[item.channel] === false && notificationsEnabled) {
        await notifyChannelLive(item.channel, item.result);
      }
    }

    await chrome.storage.local.set({ liveStates: newLiveStates });

    const liveCount = results.reduce((acc, curr) => acc + (curr.isLive === true ? 1 : 0), 0);

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

// Profil fotoğrafını indirip bildirimde kullanılabilir data URL'e çevirir
async function getAvatarDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Avatar alınamadı:", e);
    return null;
  }
}

// Ayarlar ekranındaki test butonu için örnek bildirim gösterir
async function sendTestNotification() {
  let iconUrl = "icon/icon.png";
  let title = "Test bildirimi";
  let message = "Bildirimler çalışıyor. Takip ettiğin bir yayıncı canlı yayına geçtiğinde böyle bir bildirim alacaksın.";

  try {
    const data = await chrome.storage.local.get(["channels"]);
    const channels = data.channels || [];

    if (channels.length > 0) {
      const response = await fetch(`https://kick.com/api/v1/channels/${channels[0]}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const result = await response.json();
        const displayName = result.user?.display_name || result.user?.username || channels[0];
        const avatar = await getAvatarDataUrl(result.user?.profile_pic);
        if (avatar) {
          iconUrl = avatar;
        }
        title = result.livestream
          ? `${displayName} canlı yayına geçti!`
          : `${displayName} için test bildirimi`;
        message = result.livestream?.session_title || message;
      }
    }
  } catch (e) {
    console.error("Test verisi alınamadı:", e);
  }

  try {
    await chrome.notifications.create(`kick-test-${Date.now()}`, {
      type: "basic",
      iconUrl: iconUrl,
      title: title,
      message: message
    });
  } catch (e) {
    console.error("Test bildirimi gösterilemedi:", e);
  }
}

// Kanal canlı yayına geçtiğinde sistem bildirimi gösterir
async function notifyChannelLive(channel, result) {
  const displayName = result.user?.display_name || result.user?.username || channel;
  const streamTitle = result.livestream?.session_title || "Kick'te şu anda yayında!";

  let iconUrl = "icon/icon.png";
  const avatar = await getAvatarDataUrl(result.user?.profile_pic);
  if (avatar) {
    iconUrl = avatar;
  }

  try {
    await chrome.notifications.create(`kick-live-${channel}-${Date.now()}`, {
      type: "basic",
      iconUrl: iconUrl,
      title: `${displayName} canlı yayına geçti!`,
      message: streamTitle
    });
  } catch (e) {
    console.error("Bildirim gösterilemedi:", e);
  }
}
