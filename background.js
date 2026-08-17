async function checkStreams() {
  const data = await browser.storage.local.get(["streamers"]);
  const streamers = data.streamers || [];

  if (streamers.length === 0) {
    await browser.action.setBadgeText({ text: "" });
    return;
  }

  let liveCount = 0;

  for (const username of streamers) {
    try {
      // Cloudflare engelini aşmak için credentials: 'include'
      const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.livestream) {
          liveCount++;
        }
      } else {
        console.log(`Kick engeline takıldı (${username}), Durum Kodu:`, response.status);
      }
    } catch (error) {
      console.error(`Sorgu hatası (${username}):`, error);
    }
  }

  // Rozeti güncelle
  if (liveCount > 0) {
    await browser.action.setBadgeBackgroundColor({ color: "#53FC18" });
    await browser.action.setBadgeText({ text: String(liveCount) });
  } else {
    await browser.action.setBadgeText({ text: "" });
  }
}

browser.alarms.create("checkKickStreams", { periodInMinutes: 2 });
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkKickStreams") checkStreams();
});

browser.runtime.onInstalled.addListener(() => {
  browser.action.setIcon({ path: "icon/icon.png" });
  checkStreams();
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "refresh") checkStreams();
});