# Misty Webapp Hosting Plan

## Your Goals
✅ Frontend hosted on `aditya-sinha.xyz`  
✅ Backend has a stable/static URL  
✅ Access from mobile devices  
✅ Share with others (while laptop is on)

---

## Solution Overview

### Frontend Hosting (3 Options)

#### **Option A: Netlify (RECOMMENDED for ease)**
- **Cost**: Free tier available
- **Setup**: ~5 minutes
- **URL**: `aditya-sinha.xyz` (with DNS pointing)
- **Pros**: 
  - Simple deployment (drag & drop or CLI)
  - Automatic HTTPS
  - Custom domain support
  - Fully static = fast

**Steps:**
1. Create Netlify account (netlify.com)
2. Connect GitHub repo or drag `frontend/` folder
3. Set build command: `echo` (no build needed)
4. Set publish directory: `./frontend`
5. In your domain registrar, point `aditya-sinha.xyz` DNS to Netlify
6. Done!

#### **Option B: Vercel (Also Simple)**
- **Cost**: Free tier available
- **Setup**: ~5 minutes
- **URL**: `aditya-sinha.xyz`
- **Similar to Netlify**, very beginner-friendly

#### **Option C: Your Own Server (If you have VPS)**
- **Cost**: Depends on hosting provider
- **Setup**: ~15 minutes
- **URL**: `aditya-sinha.xyz`
- **More control, but more maintenance**

---

### Backend Hosting (2 Recommended Options)

Since your backend runs on your laptop with CPU-intensive ML models (Whisper), the best approach is **tunneling** — expose your local server to the internet with a static URL.

#### **Option 1: Cloudflare Tunnel (RECOMMENDED)**
- **Cost**: FREE
- **Stability**: Production-grade
- **URL**: Something like `https://misty-api.yourdomain.com`
- **Pros**:
  - No port forwarding needed
  - Built-in DDoS protection
  - Easy to set up
  - Free forever
  - Can use custom domain

**Setup:**
```bash
# Install Cloudflare Tunnel client
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Run this in your backend folder:
cloudflared tunnel run misty-tunnel
```

Then configure DNS records in Cloudflare to point to the tunnel.

#### **Option 2: ngrok (Simple but Limited)**
- **Cost**: Free tier (with limitations) or $15/month for stable URL
- **URL**: Either dynamic (`https://abc123.ngrok.io`) or static with paid plan
- **Good if**: You want instant setup without domain setup

**Setup:**
```bash
# Install: https://ngrok.com/download
# Run in backend folder:
ngrok http 8000
```

Returns a public URL like `https://abc123.ngrok.io`  
⚠️ **Note**: Free tier URL changes every time you restart. Paid plan ($15/mo) gives a fixed URL.

---

## Recommended Setup

### **Best Option for Your Use Case:**

```
┌─────────────────────────────────────────┐
│         aditya-sinha.xyz (Netlify)      │ ← Frontend (always on)
│                                         │
│ Requests go to backend at:              │
│ https://misty-api.aditya-sinha.xyz      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Cloudflare Tunnel (Your Laptop)       │
│         runs: cloudflared tunnel        │
│                                         │
│   Exposes: http://127.0.0.1:8000        │
│   To: https://misty-api.aditya-sinha.xyz│
└─────────────────────────────────────────┘
```

### **Steps:**

#### **1. Deploy Frontend to Netlify**

```bash
# In VS Code terminal:
cd frontend

# Go to Netlify.com → New site → Drag and drop the frontend folder
# Or use CLI:
npm install -g netlify-cli
netlify deploy --prod --dir .
```

Then in Netlify dashboard:
- Go to Domain settings
- Add your custom domain `aditya-sinha.xyz`
- Follow DNS instructions

#### **2. Set Up Cloudflare Tunnel for Backend**

```bash
# Download cloudflared from:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Create a tunnel named "misty"
cloudflared tunnel create misty

# Then create a config file at: C:\Users\<username>\.cloudflared\config.yml
# Content:
tunnel: misty
credentials-file: C:\Users\<username>\.cloudflared\<UUID>.json

ingress:
  - hostname: misty-api.aditya-sinha.xyz
    service: http://localhost:8000
  - service: http_status:404

# Run the tunnel
cloudflared tunnel run misty
```

In Cloudflare DNS dashboard:
- Add CNAME record: `misty-api.aditya-sinha.xyz` → `<tunnel-id>.cfargotunnel.com`

#### **3. Update Frontend Config**

Update `frontend/config.js`:
```javascript
const BACKEND_URL = "https://misty-api.aditya-sinha.xyz";
```

#### **4. Re-deploy Frontend**

After updating config:
```bash
netlify deploy --prod --dir .
```

---

## Full Implementation Steps

### **Part 1: Deploy Frontend (Netlify)**
- [ ] Create Netlify account
- [ ] Drag & drop `frontend/` folder to Netlify
- [ ] Add domain `aditya-sinha.xyz`
- [ ] Update DNS at domain registrar
- [ ] Verify site is live

### **Part 2: Set Up Backend Tunnel**
- [ ] Create Cloudflare account (free)
- [ ] Download cloudflared
- [ ] Create tunnel
- [ ] Point DNS to tunnel
- [ ] Test tunnel is working

### **Part 3: Connect Frontend to Backend**
- [ ] Update `config.js` with tunnel URL
- [ ] Re-deploy frontend to Netlify
- [ ] Test push-to-talk on mobile

### **Part 4: Keep Tunnel Running**
- [ ] Start backend server: `uvicorn backcode:app --host 127.0.0.1 --port 8000`
- [ ] Start tunnel: `cloudflared tunnel run misty`
- [ ] Both keep running while you want the site accessible

---

## Testing

### **Can't access on mobile?**

1. Check both are running:
   - Backend: `http://127.0.0.1:8000/docs` should work locally
   - Tunnel: Shows "Connected" message in terminal

2. Check DNS:
   - `nslookup misty-api.aditya-sinha.xyz` should resolve

3. Check CORS:
   - Already enabled in backend for all origins ✅

4. Check config.js:
   - Should point to tunnel URL, not localhost

---

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| **Frontend (Netlify)** | FREE | Unlimited sites, static hosting |
| **Backend (Cloudflare Tunnel)** | FREE | Unlimited bandwidth, production-ready |
| **Domain (aditya-sinha.xyz)** | ~$10-15/year | Your existing domain |
| **TOTAL** | ~$10-15/year | Just domain cost! |

---

## Alternative: Simpler but Less Stable

If you don't want to deal with Cloudflare:

```bash
# Use ngrok (quick start)
ngrok http 8000

# You get URL like: https://abc123.ngrok.io
# Update config.js to use this URL
# ⚠️ Problem: URL changes every restart unless you pay $15/month
```

---

## Once Running

### **To share with others:**
1. Send them `aditya-sinha.xyz`
2. They can open it on any device
3. Works on mobile, desktop, tablet
4. Anyone can use it while:
   - Your backend server is running (`uvicorn backcode:app --host 127.0.0.1 --port 8000`)
   - Cloudflare tunnel is running (`cloudflared tunnel run misty`)
   - Both running on your laptop

### **Mobile Access:**
- Open `https://aditya-sinha.xyz` on any phone (on any network)
- Allow microphone permission
- Use push-to-talk normally

---

## Troubleshooting

### **"Cannot reach backend"**
- Check backend server is running locally
- Check tunnel shows "Connected"
- Check DNS is resolving

### **"Microphone permission denied"**
- Browser security feature (not a hosting issue)
- User needs to allow in browser settings

### **"Tunnel disconnected"**
- Terminal/app crashed or computer went to sleep
- Just restart: `cloudflared tunnel run misty`

### **"Domain not resolving"**
- DNS changes can take 24-48 hours
- Or check if you updated registrar correctly

---

## Next Steps (After Hosting Works)

1. ✅ Mobile access working?
2. Consider: Auto-start tunnel on system boot
3. Consider: Keep backend running as background service
4. Optional: Add auth to prevent random access
5. Optional: Upgrade ngrok if you don't want Cloudflare

---

## My Recommendation

**GO WITH: Netlify + Cloudflare Tunnel**

Why:
- ✅ Completely FREE
- ✅ Production-ready
- ✅ Fast & reliable
- ✅ No uptime limitations
- ✅ Works perfectly for your use case
- ✅ Easy to manage

Just make sure both services keep running!
