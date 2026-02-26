const recordBtn = document.getElementById("recordBtn");
const speechBox = document.getElementById("speechBox");
const sendBtn = document.getElementById("sendBtn");
const responseBox = document.getElementById("responseBox");

let mediaRecorder;
let audioChunks = [];

/* ----------- Speech Recognition (TEXT LIVE) ----------- */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = false;
recognition.interimResults = false;

recordBtn.onmousedown = async () => {

  recognition.start();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.start();

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  recordBtn.innerText = "Recording...";
};

recordBtn.onmouseup = () => {
  recognition.stop();
  mediaRecorder.stop();
  recordBtn.innerText = "Hold to Speak";
};

recognition.onresult = event => {
  speechBox.value = event.results[0][0].transcript;
};

/* ----------- SEND TO BACKEND ----------- */

sendBtn.onclick = async () => {

  const blob = new Blob(audioChunks, { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "voice.wav");

  responseBox.innerText = "Sending to server...";

  const response = await fetch("http://127.0.0.1:8000/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  responseBox.innerText = data.message;

  // SPEAK RESPONSE
  const utterance = new SpeechSynthesisUtterance(data.message);
  speechSynthesis.speak(utterance);

  audioChunks = [];
};