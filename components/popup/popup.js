document.addEventListener("DOMContentLoaded", async function () {
  const settingsBtn = document.getElementById("settingsBtn");
  const breakButton = document.getElementById("breakDayBtn");

  document.getElementById("websiteBtn").addEventListener("click", function () {
    window.open("https://4000days.com", "_blank");
  });

  // Settings button handler
  settingsBtn.addEventListener("click", function () {
    chrome.tabs.create({ url: "components/settings/settings.html" });
  });

  // 24-hour cooldown
  function isTimeForBreak(lastBreakTime) {
    if (!lastBreakTime) return true;
    const last = new Date(lastBreakTime);
    const now = new Date();
    const diffMs = now - last;
    return diffMs >= 24 * 60 * 60 * 1000; // 24 hours
  }

  function breakButtonUIHandler() {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");
    if (isTimeForBreak(lastDailyBreakClickTime)) {
      breakButton.classList.remove("bg-[color:var(--color-gray-800)]");
      breakButton.classList.remove("cursor-not-allowed");
      breakButton.classList.add("hover:bg-[#0e4e4f]");
    } else {
      breakButton.classList.add("bg-[color:var(--color-gray-800)]");
      breakButton.classList.add("cursor-not-allowed");
      breakButton.classList.remove("hover:bg-[#0e4e4f]");
    }
  }

  breakButtonUIHandler();

  breakButton.addEventListener("click", () => {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");
    const isBreakAllowed = isTimeForBreak(lastDailyBreakClickTime);

    if (isBreakAllowed) {
      // Store break time
      localStorage.setItem("dailyBreakUTC", new Date());

      // Update button appearance
      breakButton.classList.add("bg-[color:var(--color-gray-800)]");
      breakButton.classList.add("cursor-not-allowed");
      breakButton.classList.remove("hover:bg-[#0e4e4f]");

      // Remove effects immediately
      chrome.runtime.sendMessage({ action: "disableAllEffects" });

      // Set timer to re-enable effects after 10 minutes
      chrome.runtime.sendMessage({
        action: "startBreak",
        timestamp: new Date().toISOString(),
        breakDurationMs: 10 * 60 * 1000, // 10 minutes
      });

      alert("You've unlocked a 10-minute break. Relax!"); // 10 minutes
    } else {
      const last = new Date(lastDailyBreakClickTime);
      const now = new Date();
      const diffMs = now - last;
      const remainingMs = 24 * 60 * 60 * 1000 - diffMs; // 24 hour cooldown
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor(
        (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      alert(
        `Please wait ${remainingHours} hour(s) and ${remainingMinutes} minute(s) before taking another break.`
      );
    }
  });

  document.getElementById("rateUsBtn").addEventListener("click", function () {
    window.open(
      "https://chromewebstore.google.com/detail/4000-days-extension/hkmigjoopgdahhbdlopmcajccgdmlmej",
      "_blank"
    );
  });
});
