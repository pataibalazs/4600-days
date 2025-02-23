(function () {
  if (window.videoRotationScriptInjected) return; // Prevent duplicate injections
  window.videoRotationScriptInjected = true;

  console.log("Video rotation script injected");

  window.videoRotationEnabled = true; // Start in enabled state

  function rotateVideos() {
    if (!window.videoRotationEnabled) return; // Stop rotating if disabled

    document.querySelectorAll("video").forEach((video) => {
      if (!video.dataset.rotationApplied) {
        video.style.transition = "transform 1s ease-in-out"; // Smooth transition
        video.dataset.rotationApplied = "true";

        let angle = 0;
        setInterval(() => {
          if (!window.videoRotationEnabled) return; // Stop if disabled

          angle = angle === 2 ? -2 : 2; // Alternate between -10 and 10 degrees
          video.style.transform = `rotate(${angle}deg)`;
        }, 1000); // Rotate back and forth every second

        console.log("Video rotation started");
      }
    });
  }

  window.videoRotationInterval = setInterval(rotateVideos, 500); // Run check every 0.5 sec

  // Function to stop rotation
  window.stopVideoRotation = function () {
    window.videoRotationEnabled = false;
    clearInterval(window.videoRotationInterval);
    document.querySelectorAll("video").forEach((video) => {
      video.style.transform = "rotate(0deg)"; // Reset rotation
      delete video.dataset.rotationApplied;
    });
    console.log("Video rotation stopped");
  };
})();
