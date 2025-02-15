chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
      text: "OFF",
    });
  });

const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';
const youtube = 'https://www.youtube.com/';

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore) || tab.url.startsWith(youtube)) {
    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    if (nextState === "ON") {
        
        await chrome.scripting.insertCSS({
          files: ["video-rotate.css"],
          target: { tabId: tab.id },
        });
      } else if (nextState === "OFF") {
        
        await chrome.scripting.removeCSS({
          files: ["video-rotate.css"],
          target: { tabId: tab.id },
        });
      }
    
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
  }
});


