const holdBtn = document.getElementById("holdBtn");
const toggleBtn = document.getElementById("toggleBtn");
const transcriptionBox = document.getElementById("transcription");
const responseBox = document.getElementById("response");
const statusEl = document.getElementById("status");
const backendUrlEl = document.getElementById("backendUrl");

backendUrlEl.textContent = BACKEND_URL;

let mediaRecorder = null;
let audioChunks = [];
let currentStream = null;

/* ================= START RECORDING ================= */

async function startRecording() {

  if (mediaRecorder && mediaRecorder.state === "recording") return;

  try {
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(currentStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stopMicStream();
      await sendAudioToBackend();
    };

    mediaRecorder.start();

    holdBtn.classList.add("recording");
    statusEl.textContent = "Recording...";
    toggleBtn.textContent = "⏹ Stop Recording";

  } catch (err) {
    statusEl.textContent = "Microphone error: " + err.message;
  }
}

/* ================= STOP RECORDING ================= */

function stopRecording() {

  if (!mediaRecorder) return;

  if (mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    holdBtn.classList.remove("recording");
    statusEl.textContent = "Processing...";
    toggleBtn.textContent = "▶ Start Recording";
  }
}

function stopMicStream() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
}

/* ================= SEND AUDIO ================= */

async function sendAudioToBackend() {

  const blob = new Blob(audioChunks, { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "recording.wav");

  try {
    const uploadRes = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: formData
    });

    const data = await uploadRes.json();
    pollForResults(data.job_id);

  } catch (err) {
    statusEl.textContent = "Upload failed";
  }
}

/* ================= POLL ================= */

async function pollForResults(jobId) {

  while (true) {

    const res = await fetch(`${BACKEND_URL}/status/${jobId}`);
    const data = await res.json();

    if (data.status === "done") {
      transcriptionBox.value = data.text || "";
      responseBox.value = data.response || "";
      statusEl.textContent = "Done";
      return;
    }

    if (data.status === "error") {
      statusEl.textContent = "Backend Error";
      return;
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

/* ================= EVENTS ================= */

holdBtn.addEventListener("mousedown", startRecording);
holdBtn.addEventListener("mouseup", stopRecording);
holdBtn.addEventListener("mouseleave", stopRecording);

toggleBtn.addEventListener("click", () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    startRecording();
  } else {
    stopRecording();
  }
});