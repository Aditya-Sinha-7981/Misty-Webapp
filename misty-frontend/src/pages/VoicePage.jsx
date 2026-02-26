import { useState, useRef } from "react";
import "./VoicePage.css";

function VoicePage() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const pollStatus = async (jobId) => {
    const maxAttempts = 60; // 60 seconds max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await fetch(`http://127.0.0.1:8000/status/${jobId}`);
        const statusData = await statusResponse.json();

        if (statusData.status === "done") {
          setText(statusData.text || "No transcription");
          setResponse(statusData.response || "No response");
          setProcessing(false);
          return;
        } else if (statusData.status === "error") {
          setText("Error processing audio");
          setResponse(statusData.response || "Unknown error");
          setProcessing(false);
          return;
        }

        // Still processing, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      } catch (error) {
        console.error("Status check error:", error);
        setProcessing(false);
        setResponse("Error checking status: " + error.message);
        return;
      }
    }

    // Timeout
    setProcessing(false);
    setResponse("Processing timeout - took too long");
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert("Microphone not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });

        const formData = new FormData();
        formData.append("file", blob, "recording.wav");

        setProcessing(true);
        setText("Sending audio...");
        setResponse("");

        try {
          const response = await fetch("http://127.0.0.1:8000/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.job_id) {
            setText("Processing audio...");
            // Start polling for status
            await pollStatus(data.job_id);
          } else {
            setText("Error: No job ID returned");
            setProcessing(false);
          }
        } catch (error) {
          setText("Error uploading audio");
          setResponse(error.message);
          setProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Microphone access denied: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="voice-container">
      <h1>Misty Voice Assistant</h1>

      <button
        className={`record-btn ${isRecording ? "recording" : ""}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={processing}
      >
        {isRecording ? "🔴 Recording..." : processing ? "⏳ Processing..." : "🎤 Hold to Speak"}
      </button>

      <div className="results">
        <div className="transcription">
          <h3>You said:</h3>
          <textarea
            placeholder="Your speech will appear here..."
            value={text}
            readOnly={processing}
          />
        </div>

        <div className="ai-response">
          <h3>Misty says:</h3>
          <textarea
            placeholder="AI response will appear here..."
            value={response}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

export default VoicePage;