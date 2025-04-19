document.addEventListener("DOMContentLoaded", async function () {
  const toggleButton = document.querySelector("[role='switch']");
  const settingsBtn = document.getElementById("settingsBtn");
  const breakButton = document.getElementById("breakDayBtn");

  breakButtonUIHandler();

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

  //5-min break button------------------------------------------------------------
  function isTimeForBreak(lastBreakTime) {
    if (!lastBreakTime) return true;

    const last = new Date(lastBreakTime);
    const now = new Date();

    const diffMs = now - last;

    return diffMs >= 5000;
  }

  function breakButtonUIHandler() {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");

    if (isTimeForBreak(lastDailyBreakClickTime)) {
      //Van lehetőség breakre
      breakButton.classList.remove("bg-[color:var(--color-gray-800)]");
      breakButton.classList.remove("cursor-not-allowed");
      breakButton.classList.add("hover:bg-[#0e4e4f]");
    } else {
      breakButton.classList.add("bg-[color:var(--color-gray-800)]");
      breakButton.classList.add("cursor-not-allowed");
      breakButton.classList.remove("hover:bg-[#0e4e4f]");
    }
  }

  breakButton.addEventListener("click", () => {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");
    const isBreakAllowed = isTimeForBreak(lastDailyBreakClickTime);

    if (isBreakAllowed) {
      // Store break time
      localStorage.setItem("dailyBreakUTC", new Date());

      // Update button appearance
      breakButton.classList.add("bg-[color:var(--color-gray-800)]");
      breakButton.classList.add("cursor-not-allowed");
      breakButton.classList.remove("hover:bg-[#0e4e4f]");

      // Turn off the toggle
      chrome.storage.local.set({ distractionState: "OFF" }, () => {
        updateToggleUI(false);
        // Send message to background script
        chrome.runtime.sendMessage({
          action: "setToggleState",
          state: "OFF",
        });
      });

      // Set timer to turn effects back on after 5 minutes
      chrome.runtime.sendMessage({
        action: "startBreak",
        timestamp: new Date().toISOString(),
      });
      alert("You've unlocked a 5-minute break. Relax!"); // 5 minutes
    } else {
      const last = new Date(lastDailyBreakClickTime);
      const now = new Date();
      const diffMs = now - last;
      const remainingMs = 60000 - diffMs; // 1 minute cooldown
      const remainingSecs = Math.ceil(remainingMs / 1000);
      alert(
        `Please wait ${remainingSecs} seconds before taking another break.`
      );
    }
  });
});
