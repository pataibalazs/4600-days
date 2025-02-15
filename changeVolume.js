(function() {
    const video = document.querySelector("video");
    if (!video) {
        console.error("No video element found!");
        return;
    }

    function setRandomVolume() {
        let randomVolume = Math.random() * 0.3;
        video.volume = randomVolume;
        console.log(`Video volume set to: ${Math.round(randomVolume * 100)}%`);
    }

    setInterval(setRandomVolume, 1000);
})();