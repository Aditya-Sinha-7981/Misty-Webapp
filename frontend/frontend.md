# Misty Frontend – README

```markdown
# Misty Frontend

## Overview

This is the web interface for interacting with the Misty Voice System.

The frontend allows users to:
- Use **push-to-talk** to record voice
- Send audio to the backend server
- View transcription and AI response
- See real-time processing status
- Manually trigger Misty actions (dance, movement, etc.)

The frontend communicates with a **local Python FastAPI server**.

---

## Tech Stack

- React (recommended) or Vanilla JavaScript
- MediaRecorder API (for audio recording)
- Fetch API (for HTTP requests)
- Runs locally during development

---

## Project Structure

```

frontend/
│
├── src/
│   ├── components/
│   ├── App.jsx
│   ├── api.js
│   └── styles/
│
├── public/
├── package.json
└── README.md

```

---

## Running the Frontend

Install dependencies:

```

npm install

```

Run development server:

```

npm run dev

# or

npm start

```

App will run at:

```

[http://localhost:3000](http://localhost:3000)

```

---

## Backend Configuration

Backend runs at:

```

[http://localhost:8000](http://localhost:8000)

````

### IMPORTANT

Do **NOT** hardcode this permanently.

Create a config or environment variable.

Example:

```js
const API_URL = "http://localhost:8000";
````

Later this may change to:

* Local IP (LAN testing)
* ngrok URL
* Domain

---

## API Endpoints

### 1. Connection Test

**POST** `/test`

Request:

```json
{
  "message": "Hello"
}
```

Response:

```json
{
  "reply": "Server received: Hello"
}
```

---

### 2. Upload Audio

**POST** `/stt`

Content-Type: `multipart/form-data`

Field:

```
file: audio.wav
```

Response:

```json
{
  "job_id": "123",
  "status": "received"
}
```

---

### 3. Check Processing Status

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

Frontend should **poll this endpoint every 1 second** until status = done.

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

---

## Core Features to Implement

### 1. Push-to-Talk Recording

Behavior:

* Press and hold → start recording
* Release → stop recording
* Convert recording to Blob/WAV
* Send to `/stt`

Use:

* `navigator.mediaDevices.getUserMedia`
* `MediaRecorder`

---

### 2. UI States

Display clear status messages:

* Idle
* Recording…
* Uploading…
* Audio received
* Transcribing…
* Misty is thinking…
* Misty speaking

Users should never see a “silent” system.

---

### 3. Display Results

Show:

User said:

```
<transcribed text>
```

Misty:

```
<LLM response>
```

---

### 4. Status Polling Logic

After sending audio:

1. Receive `job_id`
2. Call:

```
GET /status/{job_id}
```

3. Repeat every 1 second
4. Stop when status = done
5. Display text and response

---

### 5. Control Panel

Create buttons that trigger Misty actions:

Examples:

* Dance
* Nod
* Look Left
* Look Right
* LED control (optional)

Example request:

```js
fetch(API_URL + "/action", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ action: "dance" })
});
```

---

## Audio Requirements

Preferred:

* WAV format
* Mono
* 16kHz

If conversion is difficult, send the recorded Blob directly. Backend will handle processing.

---

## Development Workflow (Git)

### Rules

* Do NOT push directly to `main`
* Always create a feature branch

Example branches:

```
feature-voice-ui
feature-audio
feature-controls
```

Workflow:

```
git checkout main
git pull origin main
git checkout -b feature-name
```

After changes:

```
git add .
git commit -m "Description"
git push origin feature-name
```

Then open a Pull Request and merge after testing.

---

## Testing Modes

### 1. Local Testing (same machine)

Backend:

```
http://localhost:8000
```

---

### 2. LAN Testing

If backend is on another device:

```
http://192.168.x.x:8000
```

(Update API_URL accordingly)

---

### 3. Remote Testing

If backend uses ngrok:

```
https://xxxx.ngrok.app
```

Update API_URL.

---

## Out of Scope (Do NOT build yet)

* Authentication
* User accounts
* Chat history database
* WebSockets
* Streaming audio
* Complex animations
* UI redesign iterations
* Mobile optimization
* Extra features not discussed

Focus on **stable API communication**.

---

## Expected User Flow

1. User opens the page
2. Holds push-to-talk
3. Speaks
4. Sees status updates
5. Misty responds with speech
6. User can trigger manual actions via buttons

---

## Goal

A stable and responsive interface that reliably communicates with the backend and enables real-time voice interaction with Misty.

