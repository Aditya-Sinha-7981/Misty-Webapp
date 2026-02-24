import os
import uuid
import requests
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

# ============================
# CONFIGURATION
# ============================

WHISPER_MODEL_SIZE = "base"   # tiny, base, small, medium
OLLAMA_MODEL = "llama3"
OLLAMA_URL = "http://localhost:11434/api/generate"

MISTY_IP = "192.168.1.10"  # 🔴 CHANGE THIS to your Misty IP

# ============================
# INITIALIZE APP
# ============================

app = FastAPI()

# Enable CORS (for frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# GLOBAL STORAGE
# ============================

jobs = {}
whisper_model = None

# ============================
# STARTUP: LOAD WHISPER
# ============================

@app.on_event("startup")
async def load_models():
    global whisper_model
    print("Loading Whisper model...")
    whisper_model = WhisperModel(
        WHISPER_MODEL_SIZE,
        compute_type="int8"  # Faster on CPU
    )
    print("Whisper model loaded.")


# ============================
# HEALTH TEST
# ============================

@app.post("/test")
def test(data: dict):
    return {"reply": f"Server received: {data.get('message')}"}


# ============================
# SPEECH TO TEXT ENDPOINT
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

    # Save uploaded file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Start background processing
    background_tasks.add_task(process_audio, job_id, file_path)

    return {"job_id": job_id, "status": "received"}


# ============================
# STATUS ENDPOINT
# ============================

@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in jobs:
        return {"error": True, "message": "Job not found"}

    return jobs[job_id]


# ============================
# MANUAL ACTION ENDPOINT
# ============================

@app.post("/action")
def action(data: dict):
    action_name = data.get("action")

    if not action_name:
        return {"error": True, "message": "No action provided"}

    speak(f"Performing {action_name}")

    return {"status": "ok"}


# ============================
# BACKGROUND PROCESSING
# ============================

def process_audio(job_id, file_path):
    try:
        # -----------------------
        # STEP 1: TRANSCRIBE
        # -----------------------
        jobs[job_id]["status"] = "transcribing"

        segments, info = whisper_model.transcribe(file_path)
        transcript = " ".join([segment.text for segment in segments]).strip()

        jobs[job_id]["text"] = transcript

        # -----------------------
        # STEP 2: LLM
        # -----------------------
        jobs[job_id]["status"] = "thinking"

        system_prompt = "You are Misty, a friendly and helpful robot assistant."

        full_prompt = f"{system_prompt}\nUser: {transcript}\nMisty:"

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": False
            }
        )

        llm_output = response.json().get("response", "").strip()

        jobs[job_id]["response"] = llm_output

        # -----------------------
        # STEP 3: SEND TO MISTY
        # -----------------------
        speak(llm_output)

        jobs[job_id]["status"] = "done"

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)

    finally:
        # Clean temp file
        if os.path.exists(file_path):
            os.remove(file_path)


# ============================
# MISTY SPEECH FUNCTION
# ============================

def speak(text):
    try:
        url = f"http://{MISTY_IP}/api/tts/speak"
        requests.post(url, json={"Text": text})
    except:
        print("Failed to send speech to Misty")