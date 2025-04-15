importScripts("scripts/domainList.js");
importScripts("scripts/activateDistractions.js");
importScripts("distractions/distractionLevels.js");

function getStoredState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["distractionState", "domainsWithEffects"],
      (result) => {
        resolve({
          state: result.distractionState || "OFF",
          domains: result.domainsWithEffects || [],
        });
      }
    );
  });
}

function addSettinOnAllTabs(jsFiles) {
  chrome.tabs.query({ url: ["*://*.instagram.com/*"] }, async (tabs) => {
    for (const tab of tabs) {
      await enableSettingsDistraction(tab.id, jsFiles);
    }
  });
}

function addCSSOnAllTabs(domainsWithEffects) {
  for (const { name, effects } of domainsWithEffects) {
    if (effects.length === 0) {
      console.log("No effects for domain:", name);
      continue;
    }
    const urlPattern = `*://*.${name}/*`;

    chrome.tabs.query({ url: [urlPattern] }, async (tabs) => {
      for (const tab of tabs) {
        await enableVisualDistraction(tab.id, effects);
      }
    });
  }
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

  if (request.action === "updateDomainList") {
    console.log("Received domain list update:", request.domains);
    chrome.storage.local.set({ domainsWithEffects: request.domains }, () => {});
    console.log("Domains saved to storage");

    addCSSOnAllTabs(request.domains);
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
          addCSSOnAllTabs(files);
        } else {
          removeVisualsOnAllTabs();
        }
      });
    });
    return true;
  }
});

// Apply domain effects when a page loads
chrome.webNavigation.onCompleted.addListener(
  (details) => {
    console.log("Page navigation completed", details.url);

    getStoredState().then(({ state, domains }) => {
      if (state === "ON" && domains.length > 0) {
        chrome.tabs.get(details.tabId, (tab) => {
          const url = new URL(tab.url);
          const hostname = url.hostname;
          console.log("Checking hostname:", hostname);

          const matchingDomain = domains.find((domain) =>
            hostname.includes(domain.name)
          );

          if (matchingDomain?.effects?.length > 0) {
            console.log("Applying effects for domain:", matchingDomain);
            enableVisualDistraction(details.tabId, matchingDomain.effects);
          }
        });
      }
    });
  },
  { url: [{ schemes: ["http", "https"] }] }
);
