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

async function enableSettingsDistraction(tabId, files) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: files,
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

async function disableSettingsDistraction2(tabId, distractionsToRemove = []) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      args: [distractionsToRemove],
      func: (distractionsToRemove) => {
        const distractions = {
          videoVolume: "videoVolumeInterval",
          videoRotation: "videoRotationInterval",
        };

        distractionsToRemove.forEach((distractionType) => {
          const intervalName = distractions[distractionType];

          if (window[intervalName]) {
            clearInterval(window[intervalName]);
            delete window[intervalName];
            console.log(`Disabled ${distractionType} distraction.`);
          }
        });
      },
    });
  } catch (error) {
    console.error("Error disabling settings distractions:", error);
  }
}
