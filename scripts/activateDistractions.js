importScripts("distractions/css_files.js");

async function enableVisualDistraction(tabId, effects) {
  if (await isThereBreak()) {
    console.log("Break mode is active, not adding CSS");
    return;
  }
  const cssList = effects.map((effect) => cssEffects[effect]).filter(Boolean);
  const combinedCSS = simpleVisualCSSMerger(cssList);

  console.log("Enabling visual distraction with CSS:", cssList);

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (css) => {
        let style = document.getElementById("distraction-style");
        if (!style) {
          style = document.createElement("style");
          style.id = "distraction-style";
          document.head.appendChild(style);
        }
        style.textContent = css;
      },
      args: [combinedCSS],
    });
  } catch (error) {
    console.error("Error injecting style:", error);
  }
}

async function disableVisualDistraction(tabId) {
  console.log("Disabling visual distraction by removing style tag");

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const style = document.getElementById("distraction-style");
        if (style) {
          style.remove();
        }
      },
    });
  } catch (error) {
    console.error("Error removing visual distraction style:", error);
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
