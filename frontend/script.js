const pushToTalkBtn = document.getElementById("pushToTalkBtn");
const toggleRecordBtn = document.getElementById("toggleRecordBtn");
const textInput = document.getElementById("textInput");
const sendTextBtn = document.getElementById("sendTextBtn");
const transcriptionBox = document.getElementById("transcription");
const responseBox = document.getElementById("response");
const statusEl = document.getElementById("status");
const backendUrlEl = document.getElementById("backendUrl");
const charCountEl = document.getElementById("charCount");

// Backend URL from config.js - can be changed in config.js
// const BACKEND_URL is already defined globally from config.js

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isToggleMode = false;
let mediaStream = null;

// ============ INITIALIZE ============

window.addEventListener("DOMContentLoaded", () => {
  // Display the configured backend URL
  if (backendUrlEl && typeof BACKEND_URL !== 'undefined') {
    backendUrlEl.textContent = BACKEND_URL;
  }
  
  // Set up character counter
  if (textInput && charCountEl) {
    textInput.addEventListener("input", () => {
      charCountEl.textContent = textInput.value.length;
    });
  }
});

// ============ RECORDING FUNCTIONS ============

async function startRecording() {
  try {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;
    
    mediaRecorder = new MediaRecorder(stream);
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      // Stop all tracks in the stream
      stream.getTracks().forEach(track => track.stop());
      mediaStream = null;
      
      await sendAudioToBackend();
    };

    mediaRecorder.start();
    statusEl.textContent = "Recording audio...";
  } catch (error) {
    statusEl.textContent = "❌ Microphone error: " + error.message;
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    statusEl.textContent = "Processing audio...";
    
    // Disable buttons during processing
    pushToTalkBtn.disabled = true;
    toggleRecordBtn.disabled = true;
  }
}

// ============ SEND TEXT TO BACKEND ============

async function sendTextToBackend(text) {
  try {
    sendTextBtn.disabled = true;
    textInput.disabled = true;
    statusEl.textContent = "📨 Sending your message to Misty...";

    const response = await fetch(`${BACKEND_URL}/text-input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const jobId = data.job_id;

    if (!jobId) {
      throw new Error("No job_id returned from backend");
    }

    // Poll for text processing results
    statusEl.textContent = "💭 Misty is thinking...";
    await pollForTextResults(jobId);
  } catch (error) {
    statusEl.textContent = "❌ Send failed: " + error.message;
    sendTextBtn.disabled = false;
    textInput.disabled = false;
  }
}

// ============ POLL TEXT RESULTS ============

async function pollForTextResults(jobId) {
  const maxAttempts = 60; // 30 seconds (60 * 500ms)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const statusResponse = await fetch(`${BACKEND_URL}/status/${jobId}`);
      const statusData = await statusResponse.json();

      if (statusData.status === "done") {
        // Success!
        transcriptionBox.value = statusData.text || "(no text)";
        responseBox.value = statusData.response || "(no response)";
        statusEl.textContent = "✅ Misty has responded!";
        sendTextBtn.disabled = false;
        textInput.disabled = false;
        textInput.value = ""; // Clear input
        if (charCountEl) charCountEl.textContent = "0"; // Reset counter
        textInput.focus();
        return;
      } else if (statusData.status === "error") {
        // Error in backend
        transcriptionBox.value = statusData.text || "ERROR";
        responseBox.value = statusData.response || "Unknown error";
        statusEl.textContent = "❌ Misty had a brain glitch...";
        sendTextBtn.disabled = false;
        textInput.disabled = false;
        return;
      }

      // Update status with fun message
      if (statusData.message) {
        statusEl.textContent = statusData.message;
      }

      // Still processing, wait and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    } catch (error) {
      statusEl.textContent = "❌ Status check error: " + error.message;
      sendTextBtn.disabled = false;
      textInput.disabled = false;
      return;
    }
  }

  // Timeout
  statusEl.textContent = "⏱️ Misty is taking too long to think...";
  sendTextBtn.disabled = false;
  textInput.disabled = false;
}

// ============ SEND AUDIO TO BACKEND ============

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
    pushToTalkBtn.disabled = false;
    toggleRecordBtn.disabled = false;
    pushToTalkBtn.classList.remove("recording");
    toggleRecordBtn.classList.remove("recording");
    toggleRecordBtn.textContent = "⏹️ START RECORDING";
    isToggleMode = false;
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
        pushToTalkBtn.disabled = false;
        toggleRecordBtn.disabled = false;
        pushToTalkBtn.classList.remove("recording");
        toggleRecordBtn.classList.remove("recording");
        toggleRecordBtn.textContent = "⏹️ START RECORDING";
        isToggleMode = false;
        return;
      } else if (statusData.status === "error") {
        // Error in backend
        transcriptionBox.value = "ERROR";
        responseBox.value = statusData.response || "Unknown error";
        statusEl.textContent = "❌ Backend error";
        pushToTalkBtn.disabled = false;
        toggleRecordBtn.disabled = false;
        pushToTalkBtn.classList.remove("recording");
        toggleRecordBtn.classList.remove("recording");
        toggleRecordBtn.textContent = "⏹️ START RECORDING";
        isToggleMode = false;
        return;
      }

      // Still processing, wait and retry
      statusEl.textContent = `Processing... (${attempts + 1}s)`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    } catch (error) {
      statusEl.textContent = "❌ Status check error: " + error.message;
      pushToTalkBtn.disabled = false;
      toggleRecordBtn.disabled = false;
      pushToTalkBtn.classList.remove("recording");
      toggleRecordBtn.classList.remove("recording");
      toggleRecordBtn.textContent = "⏹️ START RECORDING";
      isToggleMode = false;
      return;
    }
  }

  // Timeout
  statusEl.textContent = "⏱️ Processing timeout (took >60s)";
  pushToTalkBtn.disabled = false;
  toggleRecordBtn.disabled = false;
  pushToTalkBtn.classList.remove("recording");
  toggleRecordBtn.classList.remove("recording");
  toggleRecordBtn.textContent = "⏹️ START RECORDING";
  isToggleMode = false;
}

// ============ BUTTON EVENTS ============

// PUSH-TO-TALK Button: Hold to record
pushToTalkBtn.addEventListener("mousedown", () => {
  pushToTalkBtn.classList.add("recording");
  startRecording();
});

pushToTalkBtn.addEventListener("mouseup", () => {
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

pushToTalkBtn.addEventListener("mouseleave", () => {
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

// TOGGLE RECORDING Button: Click to toggle
toggleRecordBtn.addEventListener("click", async () => {
  if (!isToggleMode && !isRecording) {
    // Start recording
    isToggleMode = true;
    toggleRecordBtn.classList.add("recording");
    toggleRecordBtn.textContent = "⏹️ STOP RECORDING";
    await startRecording();
  } else if (isToggleMode && isRecording) {
    // Stop recording
    isToggleMode = false;
    toggleRecordBtn.classList.remove("recording");
    toggleRecordBtn.textContent = "⏹️ START RECORDING";
    stopRecording();
  }
});

// Touch support for mobile - Push-to-Talk
pushToTalkBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pushToTalkBtn.classList.add("recording");
  startRecording();
});

pushToTalkBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

// ============ TEXT INPUT EVENTS ============

sendTextBtn.addEventListener("click", () => {
  const text = textInput.value.trim();
  if (text) {
    sendTextToBackend(text);
  }
});

textInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const text = textInput.value.trim();
    if (text) {
      sendTextToBackend(text);
    }
  }
});

// ============ RECORDING FUNCTIONS ============

async function startRecording() {
  try {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream = stream;
    
    mediaRecorder = new MediaRecorder(stream);
    isRecording = true;

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      isRecording = false;
      // Stop all tracks in the stream
      stream.getTracks().forEach(track => track.stop());
      mediaStream = null;
      
      await sendAudioToBackend();
    };

    mediaRecorder.start();
    statusEl.textContent = "Recording audio...";
  } catch (error) {
    statusEl.textContent = "❌ Microphone error: " + error.message;
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    statusEl.textContent = "Processing audio...";
    
    // Disable buttons during processing
    pushToTalkBtn.disabled = true;
    toggleRecordBtn.disabled = true;
  }
}

// ============ SEND TEXT TO BACKEND ============

async function sendTextToBackend(text) {
  try {
    sendTextBtn.disabled = true;
    textInput.disabled = true;
    statusEl.textContent = "Sending text...";

    const response = await fetch(`${BACKEND_URL}/text-input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    statusEl.textContent = "✅ Text sent!";
    textInput.value = ""; // Clear input

  } catch (error) {
    statusEl.textContent = "❌ Send failed: " + error.message;
  } finally {
    sendTextBtn.disabled = false;
    textInput.disabled = false;
    textInput.focus();
  }
}

// ============ SEND AUDIO TO BACKEND ============

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
    pushToTalkBtn.disabled = false;
    toggleRecordBtn.disabled = false;
    pushToTalkBtn.classList.remove("recording");
    toggleRecordBtn.classList.remove("recording");
    toggleRecordBtn.textContent = "⏹️ START RECORDING";
    isToggleMode = false;
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
        pushToTalkBtn.disabled = false;
        toggleRecordBtn.disabled = false;
        pushToTalkBtn.classList.remove("recording");
        toggleRecordBtn.classList.remove("recording");
        toggleRecordBtn.textContent = "⏹️ START RECORDING";
        isToggleMode = false;
        return;
      } else if (statusData.status === "error") {
        // Error in backend
        transcriptionBox.value = "ERROR";
        responseBox.value = statusData.response || "Unknown error";
        statusEl.textContent = "❌ Backend error";
        pushToTalkBtn.disabled = false;
        toggleRecordBtn.disabled = false;
        pushToTalkBtn.classList.remove("recording");
        toggleRecordBtn.classList.remove("recording");
        toggleRecordBtn.textContent = "⏹️ START RECORDING";
        isToggleMode = false;
        return;
      }

      // Still processing, wait and retry
      statusEl.textContent = `Processing... (${attempts + 1}s)`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    } catch (error) {
      statusEl.textContent = "❌ Status check error: " + error.message;
      pushToTalkBtn.disabled = false;
      toggleRecordBtn.disabled = false;
      pushToTalkBtn.classList.remove("recording");
      toggleRecordBtn.classList.remove("recording");
      toggleRecordBtn.textContent = "⏹️ START RECORDING";
      isToggleMode = false;
      return;
    }
  }

  // Timeout
  statusEl.textContent = "⏱️ Processing timeout (took >60s)";
  pushToTalkBtn.disabled = false;
  toggleRecordBtn.disabled = false;
  pushToTalkBtn.classList.remove("recording");
  toggleRecordBtn.classList.remove("recording");
  toggleRecordBtn.textContent = "⏹️ START RECORDING";
  isToggleMode = false;
}

// ============ BUTTON EVENTS ============

// PUSH-TO-TALK Button: Hold to record
pushToTalkBtn.addEventListener("mousedown", () => {
  pushToTalkBtn.classList.add("recording");
  startRecording();
});

pushToTalkBtn.addEventListener("mouseup", () => {
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

pushToTalkBtn.addEventListener("mouseleave", () => {
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

// TOGGLE RECORDING Button: Click to toggle
toggleRecordBtn.addEventListener("click", async () => {
  if (!isToggleMode && !isRecording) {
    // Start recording
    isToggleMode = true;
    toggleRecordBtn.classList.add("recording");
    toggleRecordBtn.textContent = "⏹️ STOP RECORDING";
    await startRecording();
  } else if (isToggleMode && isRecording) {
    // Stop recording
    isToggleMode = false;
    toggleRecordBtn.classList.remove("recording");
    toggleRecordBtn.textContent = "⏹️ START RECORDING";
    stopRecording();
  }
});

// Touch support for mobile - Push-to-Talk
pushToTalkBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  pushToTalkBtn.classList.add("recording");
  startRecording();
});

pushToTalkBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  pushToTalkBtn.classList.remove("recording");
  stopRecording();
});

// ============ TEXT INPUT EVENTS ============

sendTextBtn.addEventListener("click", () => {
  const text = textInput.value.trim();
  if (text) {
    sendTextToBackend(text);
  }
});

textInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const text = textInput.value.trim();
    if (text) {
      sendTextToBackend(text);
    }
  }
});