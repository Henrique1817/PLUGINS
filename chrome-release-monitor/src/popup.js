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

function renderLibraries(libraries) {
  listElement.innerHTML = "";
  libraries.forEach((lib) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = `${lib.name} `;
    link.href = lib.releaseUrl || getRegistryUrl(lib);
    // link.target = "_blank";

    const versionSpan = document.createElement("span");
    versionSpan.className = "version";
    versionSpan.textContent = lib.lastKnownVersion ? `(${lib.lastKnownVersion})` : "(desconhecida)";

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
