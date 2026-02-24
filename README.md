# Misty Voice Interaction System

## Overview

This project builds a **local voice interaction system** for the Misty V2 robot.

Users interact with Misty through a web interface using **push-to-talk**.  
The system processes speech locally and returns a spoken response via Misty.

The focus of this project is:
- Low latency
- Local processing (no cloud AI)
- Reliable real-time interaction
- Modular architecture for team development

---

## System Architecture

User (Web Browser)
→ Records audio (Push-to-talk)
→ Sends audio to Python server
→ Speech-to-Text (Faster Whisper)
→ Local LLM processing
→ Response generated
→ Misty speaks response
→ Web UI displays transcript and reply

---

## Technology Stack

### Frontend
- HTML / React (team choice)
- MediaRecorder API (audio capture)
- Fetch API for backend communication

### Backend
- Python
- FastAPI
- Faster-Whisper (STT)
- Local LLM (via Ollama / llama.cpp or similar)
- Misty API integration

### Communication
- HTTP REST APIs
- Localhost during development
- ngrok / domain for remote testing

---

## Project Goals

### Primary Goals
- Push-to-talk voice interaction
- Local speech transcription
- Local LLM response
- Misty voice output
- Manual control buttons for Misty

### Performance Target
- Total response time: **1–3 seconds**

---

## Project Structure
