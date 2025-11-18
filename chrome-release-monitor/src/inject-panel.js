(() => {
	if (window.top !== window) {
		return;
	}

	const PANEL_ID = "release-monitor-panel";
	let panelElement = null;

	function ensurePanel() {
		if (panelElement) {
			return panelElement;
		}

		const container = document.createElement("div");
		container.id = PANEL_ID;
		container.setAttribute("role", "complementary");
		container.setAttribute("aria-hidden", "true");

		container.innerHTML = `
			<div class="rm-header">
				<span class="rm-title">Library Release Monitor</span>
				<button class="rm-close" type="button" aria-label="Fechar painel">&times;</button>
			</div>
			<iframe class="rm-frame" src="${chrome.runtime.getURL("src/options.html")}" title="Configurações"></iframe>
		`;

		const closeButton = container.querySelector(".rm-close");
		if (closeButton) {
			closeButton.addEventListener("click", hidePanel);
		}

		(document.body || document.documentElement).appendChild(container);
		panelElement = container;
		return panelElement;
	}

	function showPanel() {
		const panel = ensurePanel();
		panel.classList.add("rm-open");
		panel.setAttribute("aria-hidden", "false");
	}

	function hidePanel() {
		if (!panelElement) {
			return;
		}
		panelElement.classList.remove("rm-open");
		panelElement.setAttribute("aria-hidden", "true");
	}

	function togglePanel() {
		const panel = ensurePanel();
		if (panel.classList.contains("rm-open")) {
			hidePanel();
		} else {
			showPanel();
		}
	}

	document.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Escape") {
				hidePanel();
			}
		},
		true
	);

	chrome.runtime.onMessage.addListener((message) => {
		if (message?.type === "toggle-panel") {
			togglePanel();
		}
	});
})();
