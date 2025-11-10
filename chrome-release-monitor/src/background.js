const SETTINGS_KEY = "settings";
// Transparent 1x1 PNG fallback for notifications; replace with real icon later.
const NOTIFICATION_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgcbGa9sAAAAASUVORK5CYII=";

// Default settings used on first install or if none are saved
const DEFAULT_SETTINGS = {
  intervalMinutes: 60,
  libraries: [
    { id: "react", name: "react", source: "npm", lastKnownVersion: null },
    { id: "requests", name: "requests", source: "pypi", lastKnownVersion: null }
  ]
};

// Retrieve settings from storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SETTINGS_KEY], (result) => {
      resolve(result[SETTINGS_KEY] || DEFAULT_SETTINGS);
    });
  });
}

// Save settings to storage
async function saveSettings(settings) {
    return new Promise((resolve) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, resolve);
  });
}

// Schedule periodic alarm for release checks
function scheduleAlarm(intervalMinutes) {
  chrome.alarms.create("release-check", { periodInMinutes: intervalMinutes });
}

// On installation, set up default settings and schedule the alarm
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
  scheduleAlarm(settings.intervalMinutes);
});

async function fetchNpmRelease(packageName) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  if (!response.ok) {
    throw new Error(`npm registry responded with ${response.status}`);
  }
  const data = await response.json();
  const version = data["dist-tags"]?.latest;
  return version ? { version, url: `https://www.npmjs.com/package/${packageName}/v/${version}` } : null;
}

async function fetchPyPiRelease(packageName) {
  const response = await fetch(`https://pypi.org/pypi/${packageName}/json`);
  if (!response.ok) {
    throw new Error(`PyPI responded with ${response.status}`);
  }
  const data = await response.json();
  const version = data.info?.version;
  return version ? { version, url: data.info?.project_url || `https://pypi.org/project/${packageName}/${version}/` } : null;
}

async function fetchCratesRelease(crateName) {
  const response = await fetch(`https://crates.io/api/v1/crates/${crateName}`);
  if (!response.ok) {
    throw new Error(`crates.io responded with ${response.status}`);
  }
  const data = await response.json();
  const version = data.crate?.max_stable_version || data.crate?.newest_version;
  return version ? { version, url: `https://crates.io/crates/${crateName}/${version}` } : null;
}

// Fetch latest release info based on source
async function fetchLatestRelease(lib) {
  switch (lib.source) {
    case "npm":
        return fetchNpmRelease(lib.name);
    case "pypi":
        return fetchPyPiRelease(lib.name);
    case "crates":
        return fetchCratesRelease(lib.name);
    default:
        return null;
    }
}

function notifyRelease(lib, latest) {
  chrome.notifications.create(`${lib.id}-${latest.version}`, {
    type: "basic",
    iconUrl: NOTIFICATION_ICON,
    title: `${lib.name} ${latest.version}`,
    message: "Nova release detectada.",
    priority: 2,
    requireInteraction: false
  });
}

function isCriticalUpdate(previousVersion, newVersion) {
  if (!previousVersion) {
    return true;
  }
  const prev = parseSemver(previousVersion);
  const next = parseSemver(newVersion);
  if (!prev || !next) {
    return previousVersion !== newVersion;
  }
  return next.major > prev.major || (next.major === prev.major && next.minor > prev.minor);
}

function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

// Check libraries for new releases
async function checkLibraries(settings) {
    const updated = { ...settings, libraries: [...settings.libraries] };
    for (let i = 0; i < settings.libraries.length; i += 1) {
        const lib = settings.libraries[i];
    try {
      const latest = await fetchLatestRelease(lib);
      if (!latest) {
        continue;
    }
    if (!lib.lastKnownVersion || isCriticalUpdate(lib.lastKnownVersion, latest.version)) {
        notifyRelease(lib, latest);
    }
    updated.libraries[i] = { ...lib, lastKnownVersion: latest.version, releaseUrl: latest.url };
} catch (error) {
      console.error(`Failed to check ${lib.name}:`, error);
    }
}
await saveSettings(updated);
}

// Handle alarm events to check for new releases
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "release-check") {
    return;
  }
  const settings = await getSettings();
  await checkLibraries(settings);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "update-settings") {
    saveSettings(message.payload).then(() => {
      chrome.alarms.clear("release-check", () => {
        scheduleAlarm(message.payload.intervalMinutes);
        sendResponse({ ok: true });
      });
    });
    return true;
  }
  if (message?.type === "get-settings") {
    getSettings().then((settings) => sendResponse({ settings }));
    return true;
  }
  return false;
});
