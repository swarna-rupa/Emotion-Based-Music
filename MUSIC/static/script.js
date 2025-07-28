document.addEventListener("DOMContentLoaded", function() {
    // Elements
    const videoElement = document.getElementById("video");
    const canvasElement = document.getElementById("canvas");
    const detectBtn = document.getElementById("detectEmotion");
    const emotionDisplay = document.getElementById("emotionText");
    const songLinkElement = document.getElementById("songLink");
    const audioPlayerElement = document.getElementById("audioPlayer");
    const cameraErrorElement = document.getElementById("cameraError");
    const emotionContainer = document.getElementById("emotionDisplay");

    let mediaStream = null;

    // Initialize webcam
    async function initCamera() {
        try {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }

            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            videoElement.srcObject = mediaStream;
            videoElement.play();
            cameraErrorElement.style.display = "none";

        } catch (err) {
            console.error("Camera Error:", err);
            cameraErrorElement.style.display = "flex";
            cameraErrorElement.innerHTML = `
                <i class="fas fa-video-slash" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <span>Camera Error: ${err.message}</span>
                <p style="margin-top: 1rem;">Please refresh and allow camera permissions</p>
            `;
        }
    }

    // Initialize when page loads
    initCamera();

    // Set up detection button
    detectBtn.addEventListener("click", async function() {
        if (!mediaStream) {
            alert("Camera not accessible. Please allow camera permissions and refresh.");
            return;
        }

        // Loading state
        detectBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> DETECTING...`;
        detectBtn.disabled = true;
        emotionDisplay.textContent = "ANALYZING...";
        emotionDisplay.style.color = "var(--secondary-text)";

        try {
            // Capture image
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            const context = canvasElement.getContext("2d");
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            const imageData = canvasElement.toDataURL("image/jpeg");

            // Send to backend
            const response = await fetch("/detect-emotion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData })
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Display results with animation
            emotionDisplay.textContent = result.emotion.toUpperCase();
            emotionDisplay.style.color = "var(--primary-color)";
            emotionContainer.classList.add("emotion-pulse");

            // Remove animation class after it completes
            setTimeout(() => {
                emotionContainer.classList.remove("emotion-pulse");
            }, 500);

            // Handle audio playback
            if (result.song_type === "local") {
                audioPlayerElement.pause();
                audioPlayerElement.currentTime = 0;
                audioPlayerElement.src = result.song_url;

                audioPlayerElement.onloadeddata = function() {
                    audioPlayerElement.currentTime = result.start_time || 45;

                    // Try to autoplay
                    const playPromise = audioPlayerElement.play();

                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.log("Autoplay prevented");
                            audioPlayerElement.controls = true;
                        });
                    }
                };

                songLinkElement.href = result.song_url;
                songLinkElement.style.display = "flex";
            }

        } catch (error) {
            console.error("Detection Error:", error);
            emotionDisplay.textContent = "ERROR";
            emotionDisplay.style.color = "var(--primary-color)";
        } finally {
            detectBtn.innerHTML = `<i class="fas fa-music"></i> DETECT MOOD`;
            detectBtn.disabled = false;
        }
    });

    // Clean up camera stream when leaving page
    window.addEventListener("beforeunload", function() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    });
});