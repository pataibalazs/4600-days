const oneMinute = 60 * 1000; // 1 minute
const breakButtonUsageCooldown = 10 * 60 * oneMinute; // 10 hours
const breakTime = 5 * oneMinute; // 5 minutes

document.addEventListener("DOMContentLoaded", async function () {
  const settingsBtn = document.getElementById("settingsBtn");
  const breakButton = document.getElementById("breakDayBtn");
  const breakInfo = document.getElementById("breakInfo");

  document.getElementById("websiteBtn").addEventListener("click", function () {
    window.open("https://4000days.com", "_blank");
  });

  settingsBtn.addEventListener("click", function () {
    chrome.tabs.create({ url: "components/settings/settings.html" });
  });

  function isTimeForBreak(lastBreakTime) {
    if (!lastBreakTime) return true;
    const last = new Date(lastBreakTime);
    const now = new Date();
    const diffMs = now - last;
    return diffMs >= breakButtonUsageCooldown;
  }

  function getRemainingTime(lastBreakTime) {
    const last = new Date(lastBreakTime);
    const now = new Date();
    const diffMs = now - last;
    const remainingMs = breakButtonUsageCooldown - diffMs;
    if (remainingMs <= 0) return "00:00:00";
    const hours = String(Math.floor(remainingMs / (1000 * 60 * 60))).padStart(
      2,
      "0"
    );
    const minutes = String(
      Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    ).padStart(2, "0");
    const seconds = String(
      Math.floor((remainingMs % (1000 * 60)) / 1000)
    ).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function updateBreakButtonUI() {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");
    const breakPerDayText = document.getElementById("breakPerDayText");
    if (isTimeForBreak(lastDailyBreakClickTime)) {
      breakButton.disabled = false;
      breakButton.classList.remove(
        "bg-[color:var(--color-gray-800)]",
        "cursor-not-allowed"
      );
      breakButton.classList.add("hover:bg-[#0e4e4f]");
      breakInfo.textContent = "";
      if (breakPerDayText) breakPerDayText.style.display = "";
    } else {
      breakButton.disabled = true;
      breakButton.classList.add(
        "bg-[color:var(--color-gray-800)]",
        "cursor-not-allowed"
      );
      breakButton.classList.remove("hover:bg-[#0e4e4f]");
      breakInfo.textContent =
        "Next break available in: " + getRemainingTime(lastDailyBreakClickTime);
      if (breakPerDayText) breakPerDayText.style.display = "none";
    }
  }

  setInterval(updateBreakButtonUI, 1000);
  updateBreakButtonUI();

  breakButton.addEventListener("click", () => {
    const lastDailyBreakClickTime = localStorage.getItem("dailyBreakUTC");
    if (isTimeForBreak(lastDailyBreakClickTime)) {
      localStorage.setItem("dailyBreakUTC", new Date());
      breakButton.classList.add(
        "bg-[color:var(--color-gray-800)]",
        "cursor-not-allowed"
      );
      breakButton.classList.remove("hover:bg-[#0e4e4f]");
      chrome.runtime.sendMessage({
        action: "startBreak",
        timestamp: new Date().toISOString(),
        breakTime: breakTime,
      });
      alert("You've unlocked a 5-minute break. Relax!");
      updateBreakButtonUI();
    }
  });

  document.getElementById("rateUsBtn").addEventListener("click", function () {
    window.open(
      "https://chromewebstore.google.com/detail/4000-days-extension/hkmigjoopgdahhbdlopmcajccgdmlmej",
      "_blank"
    );
  });
});
