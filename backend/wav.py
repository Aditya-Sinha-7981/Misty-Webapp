import sounddevice as sd


from scipy.io.wavfile import write
import numpy as np

sample_rate = 44100  # Audio quality
channels = 1         # Mono recording

print("🎤 Push ENTER to START recording")
input()

print("🔴 Recording... Press ENTER to STOP")

recording = []

# Callback function to continuously collect audio
def callback(indata, frames, time, status):
    if status:
        print(status)
    recording.append(indata.copy())

# Start recording stream
with sd.InputStream(samplerate=sample_rate,
                    channels=channels,
                    dtype='int16',
                    callback=callback):
    
    input()  # Wait until user presses Enter again

print("🛑 Recording stopped!")

# Convert list to numpy array
audio_data = np.concatenate(recording, axis=0)

# Save file
write("output.wav", sample_rate, audio_data)

print("✅ Audio saved as output.wav")