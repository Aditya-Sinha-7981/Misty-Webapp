import os
import uuid
import shutil
import asyncio
import requests
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel


# =====================================
# GLOBAL VARIABLES
# =====================================

jobs = {}
whisper_model = None


# =====================================
# LIFESPAN (Load Whisper Once)
# =====================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global whisper_model

    print("\n🔄 Loading Whisper model...")
    whisper_model = WhisperModel("base", compute_type="int8")
    print("✅ Whisper model loaded successfully!\n")

    yield

    print("🛑 Server shutting down...")


app = FastAPI(lifespan=lifespan)


# =====================================
# CORS (Allow Frontend)
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================
# CREATE UPLOAD FOLDER
# =====================================

UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =====================================
# OLLAMA FUNCTION WITH KEYWORD CONTROL
# =====================================

def get_ollama_response(prompt: str):
    try:
        print("📡 Sending request to Ollama...")

        lower_prompt = prompt.lower()

        # 🔥 Detect keywords
        detailed = "long answer" in lower_prompt
        example = "with example" in lower_prompt

        # 🔥 Remove keywords from question
        cleaned_prompt = lower_prompt.replace("long answer", "")
        cleaned_prompt = cleaned_prompt.replace("with example", "")

        # 🔥 Build instruction dynamically
        instruction = "Answer clearly and relevantly."

        if detailed:
            instruction += " Give a detailed explanation."
        else:
            instruction += " Keep the answer short (2-3 sentences)."

        if example:
            instruction += " Include a simple example."

        final_prompt = f"""
        {instruction}

        Question:
        {cleaned_prompt.strip()}
        """

        # 🔥 Adjust output length dynamically
        max_tokens = 300 if detailed else 120

        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "tinyllama:latest",
                "prompt": final_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": max_tokens
                }
            },
            timeout=60
        )

        result = response.json()
        return result.get("response", "").strip()

    except Exception as e:
        print("❌ Ollama Error:", str(e))
        return "Error getting response from Ollama."


# =====================================
# AUDIO PROCESSING FUNCTION
# =====================================

async def process_audio(job_id: str, file_path: str):
    try:
        print("\n============================")
        print("🎤 NEW AUDIO RECEIVED")

        # 1️⃣ Transcribe
        segments, info = whisper_model.transcribe(file_path)
        transcript = " ".join([seg.text for seg in segments]).strip()

        print("📝 Transcription:")
        print(transcript)

        # 2️⃣ Send to Ollama
        reply = get_ollama_response(transcript)

        print("\n🤖 Ollama Response:")
        print(reply)
        print("============================\n")

        # 3️⃣ Save results
        jobs[job_id]["status"] = "done"
        jobs[job_id]["text"] = transcript
        jobs[job_id]["response"] = reply

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["text"] = ""
        jobs[job_id]["response"] = ""
        print("❌ Error:", str(e))


# =====================================
# UPLOAD ENDPOINT
# =====================================

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}.wav")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    jobs[job_id] = {
        "status": "processing",
        "text": "",
        "response": ""
    }

    asyncio.create_task(process_audio(job_id, file_path))

    return {"job_id": job_id}


# =====================================
# STATUS ENDPOINT
# =====================================

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        return {"error": "Invalid job id"}

    return jobs[job_id]