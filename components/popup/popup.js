document.addEventListener("DOMContentLoaded", async function () {
  const toggleButton = document.querySelector("[role='switch']");
  const settingsBtn = document.getElementById("settingsBtn");

  chrome.runtime.sendMessage({ action: "getToggleState" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving toggle state:", chrome.runtime.lastError);
      return;
    }
    if (response) {
      updateToggleUI(response.state === "ON");
    }
  });

  function updateToggleUI(isEnabled) {
    const toggleBackground = toggleButton.querySelector("span.relative");
    const toggleIndicator = toggleButton.querySelector(
      "span.pointer-events-none"
    );

    if (isEnabled) {
      toggleButton.setAttribute("aria-checked", "true");
      toggleBackground.classList.remove("bg-gray-300");
      toggleBackground.classList.add("bg-[#A3D9A5]");
      toggleIndicator.classList.remove("translate-x-0");
      toggleIndicator.classList.add("translate-x-5");
    } else {
      toggleButton.setAttribute("aria-checked", "false");
      toggleBackground.classList.remove("bg-[#A3D9A5]");
      toggleBackground.classList.add("bg-gray-300");
      toggleIndicator.classList.remove("translate-x-5");
      toggleIndicator.classList.add("translate-x-0");
    }
  }

  toggleButton.addEventListener("click", function () {
    const isActive = toggleButton.getAttribute("aria-checked") === "true";
    const nextState = isActive ? "OFF" : "ON";

    chrome.storage.local.set({ distractionState: nextState }, () => {
      if (!chrome.runtime.lastError) {
        updateToggleUI(nextState === "ON");
      } else {
        console.error("Failed to save toggle state:", chrome.runtime.lastError);
      }
    });

    chrome.runtime.sendMessage({
      action: "setToggleState",
      state: nextState,
    });
  });

  // Settings button handler
  settingsBtn.addEventListener("click", function () {
    // Open the settings page in a new tab
    chrome.tabs.create({ url: "components/settings/settings.html" });
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "updateToggle") {
      updateToggleUI(request.state === "ON");
    }
  });
});
