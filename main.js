importScripts("domainList.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "OFF" });
});

async function enableExtension(tabId) {
  try {
    // Inject CSS
    await chrome.scripting.insertCSS({
      files: ["video-rotate.css", "video-blur.css", "video-overlay.css"],
      target: { tabId: tabId },
    });

    // Inject video volume changing script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["videoVolumeChanger.js"],
    });
  } catch (error) {
    console.error("Error enabling extension:", error);
  }
}

async function disableExtension(tabId) {
  try {
    // Remove CSS
    await chrome.scripting.removeCSS({
      files: ["video-rotate.css", "video-blur.css", "video-overlay.css"],
      target: { tabId: tabId },
    });

    // Stop changing video volume
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
    console.error("Error disabling extension:", error);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (domains.some((domain) => tab.url.startsWith(domain))) {
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    if (nextState === "ON") {
      enableExtension(tab.id);
    } else if (nextState === "OFF") {
      disableExtension(tab.id);
    }

    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
});
