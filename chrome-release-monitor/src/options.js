const form = document.getElementById("settings-form");
const intervalInput = document.getElementById("interval");
const listContainer = document.getElementById("library-list");
const addButton = document.getElementById("add-library");
const template = document.getElementById("library-item-template");

let currentLibraries = [];

init();

function init() {
  chrome.runtime.sendMessage({ type: "get-settings" }, (response) => {
    const settings = response?.settings;
    if (!settings) {
      return;
    }
    intervalInput.value = settings.intervalMinutes;
    currentLibraries = (settings.libraries || []).map((lib) => ({ ...lib }));
    renderLibraries();
  });
}

addButton.addEventListener("click", () => {
  currentLibraries.push({ id: crypto.randomUUID(), name: "", source: "npm", lastKnownVersion: null });
  renderLibraries();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const interval = Number(intervalInput.value);
  const libraries = collectLibraries();
  const payload = { intervalMinutes: interval, libraries };
  chrome.runtime.sendMessage({ type: "update-settings", payload }, (response) => {
    if (response?.ok) {
      window.alert("Configurações salvas");
    } else {
      window.alert("Não foi possível salvar");
    }
  });
});

function renderLibraries() {
  listContainer.innerHTML = "";
  currentLibraries.forEach((lib, index) => {
  const fragment = template.content.cloneNode(true);
  const item = fragment.querySelector(".library-item");
  const nameInput = item.querySelector(".lib-name");
  const sourceSelect = item.querySelector(".lib-source");
  const removeButton = item.querySelector(".remove");

    nameInput.value = lib.name;
    sourceSelect.value = lib.source;

    nameInput.addEventListener("input", (event) => {
      currentLibraries[index].name = event.target.value.trim();
    });

    sourceSelect.addEventListener("change", (event) => {
      currentLibraries[index].source = event.target.value;
    });

    removeButton.addEventListener("click", () => {
      currentLibraries.splice(index, 1);
      renderLibraries();
    });

    listContainer.appendChild(item);
  });
}

function collectLibraries() {
  return currentLibraries
    .filter((lib) => lib.name)
    .map((lib) => ({
      ...lib,
      id: lib.id || crypto.randomUUID(),
      name: lib.name.trim(),
      lastKnownVersion: lib.lastKnownVersion || null,
      releaseUrl: lib.releaseUrl || null
    }));
}
