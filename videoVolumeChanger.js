if (!window.videoVolumeInterval) {
  window.videoVolumeInterval = setInterval(() => {
    const videos = document.querySelectorAll("video");
    if (videos.length > 0) {
      const randomVolume = Math.random() * 0.3; // Generates a random volume between 0 and 0.3
      videos.forEach((video) => {
        video.volume = randomVolume;
        console.log(`Set video volume to: ${(randomVolume * 100).toFixed(0)}%`);
      });
    }
  }, 1000);
}
