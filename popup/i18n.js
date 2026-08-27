const I18N = {
  tr: {
    title: "Kick Yayın Bildirici",
    tab_channels: "Kanallar",
    tab_settings: "Ayarlar",
    channel_placeholder: "Kanal adı girin...",
    add: "Ekle",
    suggested_channels: "Önerilen Kanallar",
    general: "Genel",
    show_suggestions: "Önerilen kanalları göster",
    live_notifications: "Canlı yayın bildirimleri",
    test_notification: "Test Bildirimi Gönder",
    sending: "Gönderiliyor...",
    language: "Dil",
    theme: "Tema",
    theme_hint: "Seçtiğin tema otomatik olarak kaydedilir.",
    empty: "Henüz bir kanal eklemediniz.",
    live: "Canlı",
    live_with_viewers: "🔴 Canlı ({viewers} izleyici)",
    offline: "Çevrimdışı",
    error: "Yüklenemedi",
    error_offline: "Çevrimdışı / Yüklenemedi",
    delete: "Sil",
    add_suggest: "+ Ekle",
    dismiss_suggest: "Bu öneriyi kapat",
    test_title: "Test bildirimi",
    test_message: "Bildirimler çalışıyor. Takip ettiğin bir yayıncı canlı yayına geçtiğinde böyle bir bildirim alacaksın.",
    live_title: "canlı yayına geçti!",
    test_live_title: "canlı yayına geçti!",
    test_channel_title: "için test bildirimi",
    now_live: "Kick'te şu anda yayında!",
    theme_kick: "Kick Yeşili",
    theme_ocean: "Okyanus",
    theme_purple: "Mor Gece",
    theme_sunset: "Gün Batımı",
    theme_crimson: "Kızıl Fırtına",
    theme_ice: "Buz (Açık)"
  },
  en: {
    title: "Kick Stream Notifier",
    tab_channels: "Channels",
    tab_settings: "Settings",
    channel_placeholder: "Enter channel name...",
    add: "Add",
    suggested_channels: "Suggested Channels",
    general: "General",
    show_suggestions: "Show suggested channels",
    live_notifications: "Live notifications",
    test_notification: "Send Test Notification",
    sending: "Sending...",
    language: "Language",
    theme: "Theme",
    theme_hint: "Your theme is saved automatically.",
    empty: "You haven't added any channels yet.",
    live: "Live",
    live_with_viewers: "🔴 Live ({viewers} viewers)",
    offline: "Offline",
    error: "Could not load",
    error_offline: "Offline / Could not load",
    delete: "Delete",
    add_suggest: "+ Add",
    dismiss_suggest: "Dismiss this suggestion",
    test_title: "Test notification",
    test_message: "Notifications are working. You will receive a notification like this when a streamer you follow goes live.",
    live_title: "went live!",
    test_live_title: "went live!",
    test_channel_title: "test notification for",
    now_live: "is live on Kick right now!",
    theme_kick: "Kick Green",
    theme_ocean: "Ocean",
    theme_purple: "Purple Night",
    theme_sunset: "Sunset",
    theme_crimson: "Crimson Storm",
    theme_ice: "Ice (Light)"
  },
  de: {
    title: "Kick Stream-Notifier",
    tab_channels: "Kanäle",
    tab_settings: "Einstellungen",
    channel_placeholder: "Kanalnamen eingeben...",
    add: "Hinzufügen",
    suggested_channels: "Vorgeschlagene Kanäle",
    general: "Allgemein",
    show_suggestions: "Vorgeschlagene Kanäle anzeigen",
    live_notifications: "Live-Benachrichtigungen",
    test_notification: "Testbenachrichtigung senden",
    sending: "Wird gesendet...",
    language: "Sprache",
    theme: "Thema",
    theme_hint: "Ihr Thema wird automatisch gespeichert.",
    empty: "Sie haben noch keine Kanäle hinzugefügt.",
    live: "Live",
    live_with_viewers: "🔴 Live ({viewers} Zuschauer)",
    offline: "Offline",
    error: "Nicht ladbar",
    error_offline: "Offline / Nicht ladbar",
    delete: "Löschen",
    add_suggest: "+ Hinzufügen",
    dismiss_suggest: "Diesen Vorschlag schließen",
    test_title: "Testbenachrichtigung",
    test_message: "Benachrichtigungen funktionieren. Sie erhalten eine solche Benachrichtigung, wenn ein verfolgter Streamer live geht.",
    live_title: "ist jetzt live!",
    test_live_title: "ist jetzt live!",
    test_channel_title: "Testbenachrichtigung für",
    now_live: "ist gerade live auf Kick!",
    theme_kick: "Kick-Grün",
    theme_ocean: "Ozean",
    theme_purple: "Lila Nacht",
    theme_sunset: "Sonnenuntergang",
    theme_crimson: "Purpurroter Sturm",
    theme_ice: "Eis (Hell)"
  }
};

const DEFAULT_LANG = "tr";

function getLang(lang) {
  return I18N[lang] || I18N[DEFAULT_LANG];
}

function t(key, lang) {
  return getLang(lang)[key] || I18N[DEFAULT_LANG][key] || key;
}

async function getSavedLang() {
  try {
    const data = await chrome.storage.local.get(["lang"]);
    if (data.lang && I18N[data.lang]) {
      return data.lang;
    }
  } catch (e) {
    console.error("Dil okunamadı:", e);
  }
  return DEFAULT_LANG;
}

async function saveLang(lang) {
  try {
    await chrome.storage.local.set({ lang: lang });
  } catch (e) {
    console.error("Dil kaydedilemedi:", e);
  }
}

function applyLang(lang) {
  const langData = getLang(lang);
  if (document.documentElement) {
    document.documentElement.lang = lang;
  }
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (langData[key] !== undefined) {
      el.textContent = langData[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (langData[key] !== undefined) {
      el.placeholder = langData[key];
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (langData[key] !== undefined) {
      el.title = langData[key];
    }
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.lang === lang);
  });
}

async function restoreLang() {
  const lang = await getSavedLang();
  applyLang(lang);
  return lang;
}
