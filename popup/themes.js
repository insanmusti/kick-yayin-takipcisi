const THEMES = {
  kick: {
    label: "theme_kick",
    swatch: ["#0e0e10", "#18181b", "#53fc18"],
    vars: {
      "--bg": "#0e0e10",
      "--text": "#efeff1",
      "--heading": "#53fc18",
      "--muted": "#adadb8",
      "--input-bg": "#1f1f23",
      "--input-border": "#3a3a3d",
      "--card-bg": "#18181b",
      "--card-border": "#26262c",
      "--accent": "#53fc18",
      "--accent-hover": "#42ca13",
      "--accent-text": "#000000",
      "--danger": "#eb0400",
      "--danger-border": "rgba(235, 4, 0, 0.27)",
      "--tab-active-bg": "rgba(83, 252, 24, 0.09)",
      "--scrollbar-thumb": "#333338"
    }
  },
  okyanus: {
    label: "theme_ocean",
    swatch: ["#0b1120", "#101a30", "#38bdf8"],
    vars: {
      "--bg": "#0b1120",
      "--text": "#e2e8f0",
      "--heading": "#38bdf8",
      "--muted": "#94a3b8",
      "--input-bg": "#16213a",
      "--input-border": "#27395c",
      "--card-bg": "#101a30",
      "--card-border": "#1e2d4d",
      "--accent": "#38bdf8",
      "--accent-hover": "#0ea5e9",
      "--accent-text": "#04121f",
      "--danger": "#f43f5e",
      "--danger-border": "rgba(244, 63, 94, 0.30)",
      "--tab-active-bg": "rgba(56, 189, 248, 0.12)",
      "--scrollbar-thumb": "#27395c"
    }
  },
  mor: {
    label: "theme_purple",
    swatch: ["#120e1a", "#181225", "#9147ff"],
    vars: {
      "--bg": "#120e1a",
      "--text": "#ede9f8",
      "--heading": "#a86bff",
      "--muted": "#9d94b3",
      "--input-bg": "#1e1729",
      "--input-border": "#332a45",
      "--card-bg": "#181225",
      "--card-border": "#281f38",
      "--accent": "#9147ff",
      "--accent-hover": "#7c2fe8",
      "--accent-text": "#ffffff",
      "--danger": "#ff4d6d",
      "--danger-border": "rgba(255, 77, 109, 0.30)",
      "--tab-active-bg": "rgba(145, 71, 255, 0.12)",
      "--scrollbar-thumb": "#332a45"
    }
  },
  gunbatimi: {
    label: "theme_sunset",
    swatch: ["#171009", "#1d150c", "#ff9f2e"],
    vars: {
      "--bg": "#171009",
      "--text": "#f5ece1",
      "--heading": "#ffa02e",
      "--muted": "#b3a596",
      "--input-bg": "#241a10",
      "--input-border": "#3d2d1b",
      "--card-bg": "#1d150c",
      "--card-border": "#2f2315",
      "--accent": "#ff9f2e",
      "--accent-hover": "#e8820f",
      "--accent-text": "#1a0e00",
      "--danger": "#ef4444",
      "--danger-border": "rgba(239, 68, 68, 0.30)",
      "--tab-active-bg": "rgba(255, 159, 46, 0.12)",
      "--scrollbar-thumb": "#3d2d1b"
    }
  },
  kizil: {
    label: "theme_crimson",
    swatch: ["#130b0d", "#1a1013", "#ff4655"],
    vars: {
      "--bg": "#130b0d",
      "--text": "#f4e9eb",
      "--heading": "#ff4655",
      "--muted": "#b39aa0",
      "--input-bg": "#211417",
      "--input-border": "#3a252b",
      "--card-bg": "#1a1013",
      "--card-border": "#2d1c21",
      "--accent": "#ff4655",
      "--accent-hover": "#e62e40",
      "--accent-text": "#ffffff",
      "--danger": "#ff3355",
      "--danger-border": "rgba(255, 51, 85, 0.32)",
      "--tab-active-bg": "rgba(255, 70, 85, 0.12)",
      "--scrollbar-thumb": "#3a252b"
    }
  },
  buz: {
    label: "theme_ice",
    swatch: ["#f3f4f6", "#ffffff", "#22c55e"],
    vars: {
      "--bg": "#f3f4f6",
      "--text": "#111827",
      "--heading": "#15803d",
      "--muted": "#6b7280",
      "--input-bg": "#ffffff",
      "--input-border": "#d1d5db",
      "--card-bg": "#ffffff",
      "--card-border": "#e5e7eb",
      "--accent": "#22c55e",
      "--accent-hover": "#16a34a",
      "--accent-text": "#ffffff",
      "--danger": "#dc2626",
      "--danger-border": "rgba(220, 38, 38, 0.35)",
      "--tab-active-bg": "rgba(34, 197, 94, 0.15)",
      "--scrollbar-thumb": "#cbd5e1"
    }
  }
};

const DEFAULT_THEME = "kick";

async function getSavedTheme() {
  try {
    const data = await chrome.storage.local.get(["theme"]);
    if (data.theme && THEMES[data.theme]) {
      return data.theme;
    }
  } catch (e) {
    console.error("Tema okunamadı:", e);
  }
  return DEFAULT_THEME;
}

function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
  root.dataset.theme = themeId;
}

async function saveTheme(themeId) {
  try {
    await chrome.storage.local.set({ theme: themeId });
  } catch (e) {
    console.error("Tema kaydedilemedi:", e);
  }
}

async function restoreTheme() {
  const id = await getSavedTheme();
  applyTheme(id);
  return id;
}
