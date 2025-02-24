async function enableVisualDistraction(tabId, files) {
  try {
    await chrome.scripting.insertCSS({
      files: files,
      target: { tabId: tabId },
    });
  } catch (error) {
    console.error("Error enabling visual distraction:", error);
  }
}

async function disableVisualDistraction(tabId) {
  try {
    await chrome.scripting.removeCSS({
      files: [
        "distractions/css/video-blur.css",
        "distractions/css/video-overlay.css",
        "distractions/css/video-rotate.css",
      ],
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
      files: ["videoVolumeChanger.js", "videoRotation.js"],
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
