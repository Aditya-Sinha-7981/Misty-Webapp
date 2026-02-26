const recordBtn = document.getElementById("recordBtn");
const transcriptionBox = document.getElementById("transcription");
const responseBox = document.getElementById("response");
const statusEl = document.getElementById("status");
const backendUrlEl = document.getElementById("backendUrl");

// Backend URL from config.js - can be changed in config.js
// const BACKEND_URL is already defined globally from config.js

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// ============ INITIALIZE ============

window.addEventListener("DOMContentLoaded", () => {
  // Display the configured backend URL
  if (backendUrlEl && typeof BACKEND_URL !== 'undefined') {
    backendUrlEl.textContent = BACKEND_URL;
    backendUrlEl.style.color = "#93B1B5";
  }
});

// ============ RECORDING FUNCTIONS ============

async function startRecording() {
  try {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream);
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      await sendAudioToBackend();
    };

    mediaRecorder.start();
    recordBtn.classList.add("recording");
    recordBtn.textContent = "🔴 RECORDING...";
    statusEl.textContent = "Recording audio...";
  } catch (error) {
    statusEl.textContent = "❌ Microphone error: " + error.message;
    recordBtn.textContent = "🎙️ HOLD TO SPEAK";
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    recordBtn.classList.remove("recording");
    recordBtn.textContent = "⏳ PROCESSING...";
    statusEl.textContent = "Processing audio...";
    recordBtn.disabled = true;
  }
}

// ============ SEND TO BACKEND ============

async function sendAudioToBackend() {
  try {
    const blob = new Blob(audioChunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");

    // Step 1: Upload audio
    statusEl.textContent = "Uploading to backend...";
    const uploadResponse = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const jobId = uploadData.job_id;

    if (!jobId) {
      throw new Error("No job_id returned from backend");
    }

    // Step 2: Poll for results
    statusEl.textContent = "Waiting for response...";
    await pollForResults(jobId);
  } catch (error) {
    statusEl.textContent = "❌ Error: " + error.message;
    recordBtn.textContent = "🎙️ HOLD TO SPEAK";
    recordBtn.disabled = false;
  }
}

// ============ POLL STATUS ============

async function pollForResults(jobId) {
  const maxAttempts = 120; // 60 seconds (120 * 500ms)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const statusResponse = await fetch(`${BACKEND_URL}/status/${jobId}`);
      const statusData = await statusResponse.json();

      if (statusData.status === "done") {
        // Success!
        transcriptionBox.value = statusData.text || "(no transcription)";
        responseBox.value = statusData.response || "(no response)";
        statusEl.textContent = "✅ Done!";
        recordBtn.textContent = "🎙️ HOLD TO SPEAK";
        recordBtn.disabled = false;
        return;
      } else if (statusData.status === "error") {
        // Error in backend
        transcriptionBox.value = "ERROR";
        responseBox.value = statusData.response || "Unknown error";
        statusEl.textContent = "❌ Backend error";
        recordBtn.textContent = "🎙️ HOLD TO SPEAK";
        recordBtn.disabled = false;
        return;
      }

      // Still processing, wait and retry
      statusEl.textContent = `Processing... (${attempts + 1}s)`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    } catch (error) {
      statusEl.textContent = "❌ Status check error: " + error.message;
      recordBtn.textContent = "🎙️ HOLD TO SPEAK";
      recordBtn.disabled = false;
      return;
    }
  }

  // Timeout
  statusEl.textContent = "⏱️ Processing timeout (took >60s)";
  recordBtn.textContent = "🎙️ HOLD TO SPEAK";
  recordBtn.disabled = false;
}

// ============ BUTTON EVENTS ============

recordBtn.addEventListener("mousedown", startRecording);
recordBtn.addEventListener("mouseup", stopRecording);
recordBtn.addEventListener("mouseleave", stopRecording);

// Touch support for mobile
recordBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  startRecording();
});

recordBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  stopRecording();
});