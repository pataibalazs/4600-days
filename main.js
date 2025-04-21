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

function removeCSSOnAllTabs() {
  getStoredState().then(({ domains }) => {
    const patterns = domains
      .filter((d) => d.effects?.length > 0)
      .map((d) => `*://*.${d.name}/*`);

    if (patterns.length === 0) return;

    // Query all matching tabs at once
    chrome.tabs.query({ url: patterns }, async (tabs) => {
      for (const tab of tabs) {
        const domain = domains.find((d) => tab.url.includes(d.name));
        await disableVisualDistraction(tab.id, domain.effects);
      }
    });
  });
}

/*
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

function removeCSSOnAllTabs() {
  getStoredState().then(({ domains }) => {
    const patterns = domains
      .filter((d) => d.effects?.length > 0)
      .map((d) => `*://*.${d.name}/*`);

    if (patterns.length === 0) return;

    // Query all matching tabs at once
    chrome.tabs.query({ url: patterns }, async (tabs) => {
      for (const tab of tabs) {
        const domain = domains.find((d) => tab.url.includes(d.name));
        await disableVisualDistraction(tab.id, domain.effects);
      }
    });
  });
}

/*
function removeCSSOnAllTabs() {
  getStoredState().then(({ domains }) => {
    for (const { name, effects } of domains) {
      if (effects.length === 0) {
        console.log("No effects to remove for domain:", name);
        continue;
      }
      const urlPattern = `*://*.${name}/*`;

      chrome.tabs.query({ url: [urlPattern] }, async (tabs) => {
        for (const tab of tabs) {
          await disableVisualDistraction(tab.id, effects);
        }
      });
    }
  });
}
*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getToggleState") {
    getStoredState().then((state) => sendResponse(state));
    return true;
  }

  if (request.action === "updateDomainList") {
    console.log("Received domain list update:", request.domains);

    // First remove existing effects from all domains
    getStoredState().then(({ domains }) => {
      if (domains.length > 0) {
        removeCSSOnAllTabs();
      }

      chrome.storage.local.set({ domainsWithEffects: request.domains }, () => {
        console.log("New domains saved to storage");

        // Get current state to check if we should apply effects
        chrome.storage.local.get("distractionState", (result) => {
          if (result.distractionState === "ON") {
            addCSSOnAllTabs(request.domains);
          }
        });
      });
    });

    return true;
  }

  if (request.action === "setToggleState") {
    chrome.storage.local.set({ distractionState: request.state }, () => {
      sendResponse({ success: true });

      getStoredState().then(({ domains }) => {
        if (request.state === "ON" && domains.length > 0) {
          addCSSOnAllTabs(domains);
        } else {
          removeCSSOnAllTabs();
        }
      });
    });

    return true;
  }

  //HANDLE BREAK
  if (request.action === "startBreak") {
    chrome.storage.local.set({ distractionState: "OFF" }, () => {
      chrome.runtime.sendMessage({
        action: "updateToggle",
        state: "OFF",
      });
      setTimeout(() => {
        chrome.storage.local.set({ distractionState: "ON" }, () => {
          getStoredState().then(({ domains }) => {
            if (domains.length > 0) {
              addCSSOnAllTabs(domains);
            }
          });
        });
      }, 5 * 1000); // 5 seconds
      return true;
    });

    return true;
  }
});

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (details.frameId === 0) {
      getStoredState().then(({ state, domains }) => {
        if (state === "ON" && domains.length > 0) {
          chrome.tabs.get(details.tabId, (tab) => {
            const url = new URL(tab.url);
            const hostname = url.hostname;

            const matchingDomain = domains.find((domain) =>
              hostname.includes(domain.name)
            );

            if (matchingDomain?.effects?.length > 0) {
              setTimeout(() => {
                enableVisualDistraction(details.tabId, matchingDomain.effects);
              }, 10);
            }
          });
        }
      });
    }
  },
  {
    url: [{ schemes: ["http", "https"] }],
  }
);
