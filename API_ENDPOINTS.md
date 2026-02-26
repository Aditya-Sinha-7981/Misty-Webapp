# Misty Webapp - API Endpoints & Frontend Connection Guide

## Backend Server
**Running on:** `http://127.0.0.1:8000`  
**Framework:** FastAPI  
**CORS:** Enabled for all origins

### ✅ VERIFIED ENDPOINTS

#### 1. **Upload Audio** (POST)
```
POST http://127.0.0.1:8000/upload
```
**Content-Type:** `multipart/form-data`

**Request:**
```javascript
formData.append("file", blob, "recording.wav");
```

**Response:**
```json
{
  "job_id": "uuid-here"
}
```

---

#### 2. **Get Processing Status** (GET)
```
GET http://127.0.0.1:8000/status/{job_id}
```

**Response (while processing):**
```json
{
  "status": "processing",
  "text": "",
  "response": ""
}
```

**Response (after done):**
```json
{
  "status": "done",
  "text": "user transcription text",
  "response": "AI generated response"
}
```

**Response (if error):**
```json
{
  "status": "error",
  "text": "",
  "response": "error message"
}
```

---

## Frontend Implementation

### Push-to-Talk Flow

1. **User holds button** → Microphone recording starts
2. **User releases button** → Recording stops
3. **Frontend sends audio to `/upload`** → Gets `job_id`
4. **Frontend polls `/status/{job_id}`** → Checks every 500ms
5. **Display results** → Shows transcription + AI response

### Updated Components

**File:** [misty-frontend/src/pages/VoicePage.jsx](misty-frontend/src/pages/VoicePage.jsx)

✅ **Changes Made:**
- Added `pollStatus()` function to check `/status/{job_id}` every 500ms
- Fixed response field from `data.filename` → `data.job_id`
- Added separate display for transcription and AI response
- Added error handling and timeout (60 seconds max)
- Added processing state indicators

**File:** [misty-frontend/src/pages/VoicePage.css](misty-frontend/src/pages/VoicePage.css)

✅ **Changes Made:**
- Added `.results` container with flex layout
- Separated `.transcription` and `.ai-response` sections
- Added responsive design for mobile
- Enhanced button animations and visual feedback
- Added processing status indicators

---

## Backend Technology Stack

- **FastAPI** - Web framework
- **Faster-Whisper** - Speech-to-Text transcription
- **Ollama** (tinyllama:latest) - Local LLM for responses
- **CORS Middleware** - Cross-origin requests enabled

---

## How to Run

### Backend
```bash
cd backend
uvicorn backcode:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd misty-frontend
npm install
npm run dev
```

Your frontend will be available at `http://localhost:5173` (default Vite port)

---

## Testing the Connection

1. Start the backend server
2. Start the frontend dev server
3. Click "Hold to Speak" button
4. Speak your question
5. Release button
6. Wait for transcription and AI response

### Expected Behavior
- ✅ Microphone records audio (shows "🔴 Recording...")
- ✅ Audio uploads to backend (shows "⏳ Processing...")
- ✅ Transcription appears in left box
- ✅ AI response appears in right box

---

## Troubleshooting

### Issue: "Cannot reach backend"
- Ensure backend is running on port 8000
- Check CORS is enabled (it is in current setup)

### Issue: "Microphone access denied"
- Browser needs microphone permission
- Check browser console for specific error

### Issue: "Processing timeout"
- Backend is taking >60 seconds
- Check Ollama/Whisper are loaded
- Check console for errors

### Issue: "Empty response"
- Whisper failed to transcribe (unclear audio?)
- Ollama failed to generate response (check Ollama running?)

---

## Next Steps (Optional Enhancements)

- [ ] Add stop button to interrupt processing
- [ ] Add history of past conversations
- [ ] Add settings for Ollama model selection
- [ ] Add audio playback for AI responses
- [ ] Add progress bar for processing time
- [ ] Add export conversation feature
