import os
import uuid
import requests
import pyttsx3

from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

# ============================
# CONFIG
# ============================

WHISPER_MODEL_SIZE = "base"
OLLAMA_MODEL = "llama3"
OLLAMA_URL = "http://localhost:11434/api/generate"

USE_LLM = True  # Set False if you only want transcription

# ============================
# INIT
# ============================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs = {}
whisper_model = None

# Text-to-Speech engine
tts_engine = pyttsx3.init()

# ============================
# STARTUP
# ============================

@app.on_event("startup")
async def load_model():
    global whisper_model
    print("Loading Whisper model...")
    whisper_model = WhisperModel(
        WHISPER_MODEL_SIZE,
        compute_type="int8"
    )
    print("Whisper loaded.")


# ============================
# TEST ENDPOINT
# ============================

@app.post("/test")
def test(data: dict):
    return {"reply": f"Server received: {data.get('message')}"}


# ============================
# SPEECH TO TEXT
# ============================

@app.post("/stt")
async def stt(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    job_id = str(uuid.uuid4())

    jobs[job_id] = {
        "status": "received",
        "text": "",
        "response": ""
    }

    file_path = f"temp_{job_id}.wav"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    background_tasks.add_task(process_audio, job_id, file_path)

    return {"job_id": job_id, "status": "received"}


# ============================
# STATUS
# ============================

@app.get("/status/{job_id}")
def status(job_id: str):
    if job_id not in jobs:
        return {"error": True, "message": "Job not found"}

    return jobs[job_id]


# ============================
# BACKGROUND PROCESS
# ============================

def process_audio(job_id, file_path):
    try:
        # STEP 1 — TRANSCRIBE
        jobs[job_id]["status"] = "transcribing"

        segments, info = whisper_model.transcribe(file_path)
        transcript = " ".join([seg.text for seg in segments]).strip()

        jobs[job_id]["text"] = transcript

        # STEP 2 — LLM (optional)
        if USE_LLM:
            jobs[job_id]["status"] = "thinking"

            system_prompt = "You are a helpful assistant."
            full_prompt = f"{system_prompt}\nUser: {transcript}\nAssistant:"

            response = requests.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": full_prompt,
                    "stream": False
                }
            )

            reply = response.json().get("response", "").strip()
        else:
            reply = transcript

        jobs[job_id]["response"] = reply

        # STEP 3 — SPEAK THROUGH SPEAKER
        speak(reply)

        jobs[job_id]["status"] = "done"

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


# ============================
# TEXT TO SPEECH
# ============================

def speak(text):
    tts_engine.say(text)
    tts_engine.runAndWait()