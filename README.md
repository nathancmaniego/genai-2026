# C.H.U.D — Continuous Heads-Up Display 🕶️💸

**Your deadpan AI financial advisor in your pocket.** Point your phone at anything—C.H.U.D identifies it, estimates the price, checks your budget, and tells you straight whether you should buy it. No fluff, no friction. Built for the 24-Hour Hackathon Challenge.

---

### **Elevator Pitch**

Smart glasses can tell you *what* you're looking at, but not *whether you can afford it*. **C.H.U.D** is a financial guardrail: a heads-up display that runs on your phone, uses gesture-triggered vision + Gemini to recognize products and prices, and gives you a blunt green/red verdict—plus cheaper alternatives and optional voice feedback. It turns "Should I buy this?" into a split-second decision instead of a guilty tap into a budget app.

---

### **The Problem**

Standard smart glasses are great at *identifying* what you see, but they don't know *who you are* or *how much money you have*. Consumers often make impulsive purchases because the friction of checking a budget app or finding cheaper alternatives is too high in the moment.

### **The Solution**

**C.H.U.D** (Continuous Heads-Up Display) is a financial guardrail delivered through a high-performance HUD. By combining on-device hand gesture recognition with multimodal AI, C.H.U.D provides real-time risk assessment for every item you look at. It moves beyond "What is this?" to **"Should I buy this?"**

---

### **🚀 Key Features**

- **Gesture-Triggered Vision:** Use an "Open Palm" gesture (MediaPipe) to trigger a scan without touching your device.
- **Proactive Affordability Check:** Gemini identifies products and estimates prices, comparing them against your real-time budget.
- **Deadpan Voice Feedback:** ElevenLabs delivers C.H.U.D’s sharp, witty one-liners—approvals, warnings, or dry advice.
- **Smart Alternatives:** If an item is over budget, C.H.U.D suggests cheaper alternatives or nearby deals.
- **Personalized Onboarding:** Calibrate when C.H.U.D steps in, what tone to use, and your savings goals before you hit the HUD.

---

### **🛠️ Tech Stack**

- **Mobile:** React Native (Expo) with Expo Router — forced landscape HUD, glassmorphic UI, onboarding + profile flows.
- **On-Device AI:** MediaPipe (hand landmarking & gesture detection).
- **Backend:** Python (FastAPI) — **C.H.U.D Brain** API; run with ngrok for device access.
- **Brain:** Gemini (vision + reasoning) for product ID, price estimation, and analysis.
- **Voice:** ElevenLabs (neural TTS) for voice lines.

---

### **📁 Codebase**

```
genai-2026/
├── mobile/                 # Expo (React Native) app
│   ├── app/                # Expo Router screens
│   │   ├── index.tsx       # Entry → onboarding or HUD
│   │   ├── onboarding/     # Onboarding flow (budget, goals, tone, triggers)
│   │   ├── hud/            # Main HUD (camera, reticle, overlays)
│   │   └── profile/        # User profile
│   ├── components/         # Reticle, BudgetTicker, ScanResultOverlay, etc.
│   ├── context/            # BudgetContext, OnboardingContext
│   ├── services/           # API client, storage
│   └── constants/          # Theme, onboarding config
└── backend/                # C.H.U.D Brain (FastAPI)
    ├── main.py             # API, Gemini, MediaPipe, ElevenLabs
    ├── requirements.txt
    └── .env.example        # GEMINI_API_KEY, ELEVENLABS_API_KEY, etc.
```

---

### **📸 HUD Interface**

- **Scanning Reticle:** Pulsing center-frame target.
- **Financial Ticker:** Real-time "Remaining Budget" display.
- **Decision Overlays:** **GREEN** (Affordable) vs. **RED** (Financial Risk) with item, price, analysis, and alternatives.

---

### **🏁 Setup & Demo**

1. **Backend:** Copy `backend/.env.example` to `backend/.env`, set `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`. Run `uvicorn main:app --reload` and start an ngrok tunnel to your local port.
2. **Mobile:** In `mobile/`, run `npx expo start` and open on a device (e.g. iPhone). Point the camera at products and use the open-palm gesture to scan.
3. **Demo:** Point at a $5 coffee (Green) → Point at a $2,000 laptop (Red + C.H.U.D voice warning and alternatives).

---
