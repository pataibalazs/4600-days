importScripts("domainList.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "OFF" });
});

async function enableVisualDistraction(tabId) {
  try {
    await chrome.scripting.insertCSS({
      files: ["video-rotate.css", "video-blur.css", "video-overlay.css"],
      target: { tabId: tabId },
    });
  } catch (error) {
    console.error("Error enabling visual distraction:", error);
  }
}

async function disableVisualDistraction(tabId) {
  try {
    await chrome.scripting.removeCSS({
      files: ["video-rotate.css", "video-blur.css", "video-overlay.css"],
      target: { tabId: tabId },
    });
  } catch (error) {
    console.error("Error disabling visual distraction:", error);
  }
}

async function enableSettingsDistraction(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["videoVolumeChanger.js"],
    });
  } catch (error) {
    console.error("Error enabling settings distraction:", error);
  }
}

async function disableSettingsDistraction(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        if (window.videoVolumeInterval) {
          clearInterval(window.videoVolumeInterval);
          delete window.videoVolumeInterval;
        }
      },
    });
  } catch (error) {
    console.error("Error disabling settings distraction:", error);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (domains.some((domain) => tab.url.startsWith(domain))) {
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    if (nextState === "ON") {
      enableVisualDistraction(tab.id);
      enableSettingsDistraction(tab.id);
    } else if (nextState === "OFF") {
      disableVisualDistraction(tab.id);
      disableSettingsDistraction(tab.id);
    }

    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
});
