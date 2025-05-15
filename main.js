importScripts("scripts/domainList.js");
importScripts("scripts/activateDistractions.js");
importScripts("distractions/distractionLevels.js");

function getStoredState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["domainsWithEffects"], (result) => {
      resolve({
        domains: result.domainsWithEffects || [],
      });
    });
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateDomainList") {
    console.log("Received domain list update:", request.domains);

    // First remove existing effects from all domains
    getStoredState().then(({ domains }) => {
      if (domains.length > 0) {
        removeCSSOnAllTabs();
      }

      chrome.storage.local.set({ domainsWithEffects: request.domains }, () => {
        console.log("New domains saved to storage");
        addCSSOnAllTabs(request.domains);
      });
    });

    return true;
  }

  // HANDLE BREAK
  if (request.action === "startBreak") {
    console.log("startBreak", request.timestamp);
    removeCSSOnAllTabs();
    setTimeout(async () => {
      console.log("Resuming effects after break");
      const { domains } = await getStoredState();
      if (domains && domains.length > 0) {
        addCSSOnAllTabs(domains);
      }
    }, request.breakTime);
    return true;
  }
});

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    if (details.frameId === 0) {
      getStoredState().then(({ domains }) => {
        if (domains.length > 0) {
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
