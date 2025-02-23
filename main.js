importScripts("scripts/domainList.js");
importScripts("scripts/activateDistractions.js");
importScripts("distractions/distractionLevels.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getToggleState") {
    chrome.storage.local.get(
      ["distractionState", "sliderValue"],
      function (result) {
        sendResponse({
          state: result.distractionState || "OFF",
          sliderValue: result.sliderValue || 1,
        });
      }
    );
    return true;
  }

  if (request.action === "setToggleState") {
    chrome.storage.local.set({ distractionState: request.state }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
      }
      sendResponse({ success: true });
    });

    chrome.storage.local.get("sliderValue", function (result) {
      const sliderValue = result.sliderValue || 1;
      const selectedLevel = Object.values(DistractionLevel).find(
        (level) => level.value === sliderValue
      );
      const files = selectedLevel ? selectedLevel.files : [];

      chrome.tabs.query(
        { active: true, currentWindow: true },
        async function (tabs) {
          if (tabs.length === 0) return;
          const tabId = tabs[0].id;
          if (request.state === "ON") {
            await enableVisualDistraction(tabId, files);
          } else {
            // Pass the files to disableVisualDistraction so that even with level one, distractions get removed.
            await disableVisualDistraction(tabId, files);
          }
        }
      );
    });
    return true;
  }

  if (request.action === "setSliderValue") {
    chrome.storage.local.set({ sliderValue: request.value }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to store slider value:",
          chrome.runtime.lastError
        );
      }
      sendResponse({ success: true });
    });

    // If distractions are active, update the effects immediately.
    chrome.storage.local.get("distractionState", function (result) {
      if (result.distractionState === "ON") {
        const sliderValue = request.value;
        const selectedLevel = Object.values(DistractionLevel).find(
          (level) => level.value === sliderValue
        );
        const files = selectedLevel ? selectedLevel.files : [];
        chrome.tabs.query(
          { active: true, currentWindow: true },
          async function (tabs) {
            if (tabs.length === 0) return;
            const tabId = tabs[0].id;
            // Remove any previously injected distraction files
            await disableVisualDistraction(
              tabId,
              Object.values(DistractionLevel).flatMap((l) => l.files)
            );
            await enableVisualDistraction(tabId, files);
          }
        );
      }
    });
    return true;
  }
});

/**
 * Reapply distractions when a page reloads using webNavigation.
 * Make sure to add "webNavigation" to your manifest permissions.
 */
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    chrome.storage.local.get(
      ["distractionState", "sliderValue"],
      async (result) => {
        if (result.distractionState === "ON") {
          const sliderValue = result.sliderValue || 1;
          const selectedLevel = Object.values(DistractionLevel).find(
            (level) => level.value === sliderValue
          );
          const files = selectedLevel ? selectedLevel.files : [];
          // details.tabId identifies the refreshed tab.
          await enableVisualDistraction(details.tabId, files);
        }
      }
    );
  },
  { url: [{ schemes: ["http", "https"] }] } // Filter for web pages only
);

/**
 * Applies distractions to all open tabs based on the saved state.
 */
function applyDistractionsOnOpenTabs() {
  chrome.storage.local.get(
    ["distractionState", "sliderValue"],
    function (result) {
      if (result.distractionState === "ON") {
        const sliderValue = result.sliderValue || 1;
        const selectedLevel = Object.values(DistractionLevel).find(
          (level) => level.value === sliderValue
        );
        const files = selectedLevel ? selectedLevel.files : [];
        // Query all tabs with valid HTTP/HTTPS URLs.
        chrome.tabs.query(
          { url: ["http://*/*", "https://*/*"] },
          async (tabs) => {
            for (const tab of tabs) {
              await enableVisualDistraction(tab.id, files);
            }
          }
        );
      }
    }
  );
}

// When the extension starts up (or is reloaded), apply distractions as needed.
chrome.runtime.onStartup.addListener(() => {
  applyDistractionsOnOpenTabs();
});

// Also check immediately when this background script loads.
applyDistractionsOnOpenTabs();
