const listElement = document.getElementById("library-list");
const optionsButton = document.getElementById("open-options");

function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "get-settings" }, (response) => {
      resolve(response?.settings || { libraries: [] });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSettings();
  renderLibraries(settings.libraries);
});

optionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Render the list of libraries and their versions
function renderLibraries(libraries) {
  listElement.innerHTML = "";
  if (!libraries || libraries.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "Nenhuma biblioteca monitorada ainda.";
    listElement.appendChild(emptyItem);
    return;
  }
  libraries.forEach((lib) => {
    const normalizedLib = { ...lib, name: (lib.name || "").toLowerCase().trim() };
    const item = document.createElement("li");
    item.className = "library-item";
    const link = document.createElement("a");
    link.className = "lib-link";
    link.textContent = `${normalizedLib.name} `;
    link.href = normalizedLib.releaseUrl || getRegistryUrl(normalizedLib);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const versionSpan = document.createElement("span");
    versionSpan.className = "version";
    if (normalizedLib.lastKnownVersion) {
      versionSpan.textContent = `v${normalizedLib.lastKnownVersion}`;
    } else {
      versionSpan.textContent = "sem dados";
      versionSpan.classList.add("is-unknown");
    }

    item.appendChild(link);
    item.appendChild(versionSpan);
    listElement.appendChild(item);
  });
}

function getRegistryUrl(lib) {
  switch (lib.source) {
    case "npm":
      return `https://www.npmjs.com/package/${lib.name}`;
    case "pypi":
      return `https://pypi.org/project/${lib.name}/`;
    case "crates":
      return `https://crates.io/crates/${lib.name}`;
    default:
      return "#";
  }
}
