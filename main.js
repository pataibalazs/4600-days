importScripts("scripts/domainList.js");
importScripts("scripts/activateDistractions.js");
importScripts("distractions/distractionLevels.js");


function getStoredState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["distractionState", "sliderValue"], (result) => {
      resolve({
        state: result.distractionState || "OFF",
        sliderValue: result.sliderValue || 1,
      });
    });
  });
}

function addSettinOnAllTabs(jsFiles) {
  chrome.tabs.query({ url: ["*://*.instagram.com/*"] }, async (tabs) => {
    for (const tab of tabs) {
      await enableSettingsDistraction(tab.id, jsFiles);
    }
  });
}

function addVisualsOnAllTabs(cssFiles) {
  chrome.tabs.query({ url: ["*://*.instagram.com/*"] }, async (tabs) => {
    for (const tab of tabs) {
      await enableVisualDistraction(tab.id, cssFiles);
    }
  });
}

function removeVisualsOnAllTabs() {
  chrome.tabs.query({ url: ["*://*.instagram.com/*"] }, async (tabs) => {
    for (const tab of tabs) {
      await disableVisualDistraction(tab.id);
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getToggleState") {
    getStoredState().then((state) => sendResponse(state));
    return true;
  }

  if (request.action === "setToggleState") {
    chrome.storage.local.set({ distractionState: request.state }, () => {
      sendResponse({ success: true });
      getStoredState().then(({ sliderValue }) => {
        const selectedLevel = Object.values(DistractionLevel).find(
          (level) => level.value === sliderValue
        );
        const files = selectedLevel ? selectedLevel.files : [];
        if (request.state === "ON") {
          addVisualsOnAllTabs(files);
        } else {
          removeVisualsOnAllTabs();
        }
      });
    });
    return true;
  }

  if (request.action === "setSliderValue") {
    chrome.storage.local.set({ sliderValue: request.value }, () => {
      sendResponse({ success: true });
      chrome.storage.local.get("distractionState", (result) => {
        if (result.distractionState === "ON") {
          const selectedLevel = Object.values(DistractionLevel).find(
            (level) => level.value === request.value
          );
          const files = selectedLevel ? selectedLevel.files : [];
          chrome.tabs.query({ url: ["*://*.instagram.com/*"] }, async (tabs) => {
            for (const tab of tabs) {
              await disableVisualDistraction(tab.id);
              await enableVisualDistraction(tab.id, files);
            }
          });
        }
      });
    });
    return true;
  }
});

// Reapply distractions on Instagram when a page reloads.
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    getStoredState().then(({ state, sliderValue }) => {
      if (state === "ON") {
        const selectedLevel = Object.values(DistractionLevel).find(
          (level) => level.value === sliderValue
        );
        const files = selectedLevel ? selectedLevel.files : [];
        enableVisualDistraction(details.tabId, files);
      }
    });
  },
  { url: [{ hostSuffix: "instagram.com" }] }
);
