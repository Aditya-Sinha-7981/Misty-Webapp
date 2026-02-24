# Misty Backend – README

```markdown id="misty-backend-readme-full"
# Misty Backend

## Overview

The backend is the central processing system for the Misty Voice Interaction Project.

Responsibilities:

- Receive audio from the web interface
- Transcribe speech using Faster-Whisper
- Generate responses using a local LLM
- Send speech output to Misty
- Provide real-time processing status to the frontend
- Handle manual Misty action requests

The backend runs locally and is designed for **low-latency, offline processing**.

---

## Technology Stack

- Python 3.9+
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Faster-Whisper (Speech-to-Text)
- Local LLM (Ollama / llama.cpp or similar)
- Misty REST API
- In-memory job storage (no database)

---

## Running the Server

Start the server:

```

uvicorn main:app --host 0.0.0.0 --port 8000

```

Server will be available at:

```

[http://localhost:8000](http://localhost:8000)

````

`0.0.0.0` allows access from other devices on the same network.

---

## CORS Configuration

Frontend runs on a different port, so CORS must be enabled.

Allow:
- All origins (for development)
- All methods
- All headers

Without CORS, browser requests will fail.

---

## API Endpoints

### 1. Health / Connection Test

**POST** `/test`

Request:
```json
{
  "message": "Hello"
}
````

Response:

```json
{
  "reply": "Server received: Hello"
}
```

Purpose:

* Verify frontend ↔ backend communication
* Used for initial integration testing

---

### 2. Speech Processing

**POST** `/stt`

Content-Type: `multipart/form-data`

Field:

```
file: audio.wav
```

#### Processing Flow

1. Receive audio file
2. Generate unique `job_id`
3. Store job with status = `"received"`
4. Start background task
5. Immediately return response

Response:

```json
{
  "job_id": "123",
  "status": "received"
}
```

This prevents blocking and allows real-time UI updates.

---

### 3. Job Status

**GET** `/status/{job_id}`

Possible responses:

```json
{ "status": "received" }
{ "status": "transcribing" }
{ "status": "thinking" }
```

Final response:

```json
{
  "status": "done",
  "text": "User speech text",
  "response": "LLM response"
}
```

Frontend polls this endpoint every 1 second.

---

### 4. Misty Actions

**POST** `/action`

Request:

```json
{
  "action": "dance"
}
```

Response:

```json
{
  "status": "ok"
}
```

Actions should map to existing Misty control functions.

Examples:

* dance
* nod
* look_left
* look_right
* led_color

---

## Job Management

Use an in-memory dictionary:

```
jobs = {
    job_id: {
        "status": "...",
        "text": "...",
        "response": "..."
    }
}
```

This is sufficient for:

* Local use
* Demo environment
* Single-user testing

No database required.

---

## Background Processing

Speech processing must run in a background task:

### Status Flow

1. received
2. transcribing
3. thinking
4. done

### Steps

#### Step 1: Save Audio

Save uploaded file temporarily.

Preferred format:

* WAV
* Mono
* 16kHz

---

#### Step 2: Speech-to-Text

Use Faster-Whisper:

```
status = "transcribing"
```

Output:

* Transcribed text

---

#### Step 3: LLM Processing

Send transcript to local LLM.

Example system prompt:

> You are Misty, a helpful and friendly robot assistant.

```
status = "thinking"
```

Output:

* Response text

---

#### Step 4: Misty Speech

Send response text to Misty using its REST API.

This step should not block status updates.

---

#### Step 5: Complete

Store:

```
status = "done"
text = transcript
response = llm_output
```

---

## Performance Guidelines

Target total latency:
**1–3 seconds**

Recommendations:

* Load Whisper model at startup
* Load LLM at startup
* Avoid reloading models per request
* Keep audio short (push-to-talk)

---

## Local Network Access

If frontend runs on another device:

1. Find backend IP:

```
ipconfig   (Windows)
ifconfig   (Mac/Linux)
```

2. Frontend should use:

```
http://192.168.x.x:8000
```

---

## Remote Access (Optional)

For external testing:

```
ngrok http 8000
```

Provide generated URL to frontend.

---

## Error Handling

Handle cases:

* Missing file
* Invalid audio
* Job ID not found
* Whisper failure
* LLM failure
* Misty connection failure

Always return structured JSON errors.

---

## Logging

Log important events:

* Audio received
* Transcription result
* LLM response
* Misty action triggered
* Errors

This is critical for debugging during demos.

---

## Constraints

* Local processing only (no cloud AI)
* No database
* Single-machine execution
* No authentication
* No WebSockets
* No streaming

Use HTTP polling only.

---

## Out of Scope (Do NOT implement)

* User accounts
* Conversation history storage
* Multi-user scaling
* Microservices
* Docker orchestration
* WebSocket streaming
* Real-time partial transcription

Focus on a stable pipeline.

---

## Expected End-to-End Flow

1. User presses push-to-talk
2. Audio sent to `/stt`
3. Server returns job_id
4. Frontend polls `/status`
5. Server transcribes → runs LLM → sends to Misty
6. Status becomes `"done"`
7. Frontend displays result

---

## Goal

Provide a stable, low-latency processing pipeline that enables real-time conversational interaction with Misty using fully local AI.