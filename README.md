# JARVIS: Proactive Financial HUD 🕶️💸

**Built for the 24-Hour Hackathon Challenge**

### **The Problem**

Standard smart glasses (like Meta Ray-Bans) are great at *identifying* what you see, but they don't know *who you are* or *how much money you have*. Consumers often make impulsive purchases because the friction of checking a budget app or finding cheaper alternatives is too high in the moment.

### **The Solution**

**JARVIS** is a "Financial Guardrail" simulated through a high-performance HUD. By combining on-device hand gesture recognition with multimodal AI, JARVIS provides real-time risk assessment for every item you look at. It moves beyond "What is this?" to **"Should I buy this?"**

---

### **🚀 Key Features**

- **Gesture-Triggered Vision:** Use an "Open Palm" gesture (MediaPipe) to trigger a scan without touching your device.
- **Proactive Affordability Check:** Gemini 2.0 Flash identifies products and estimates prices, comparing them against your real-time budget.
- **Witty Voice Feedback:** A "Jarvis-style" ElevenLabs voice agent whispers financial advice, warnings, or witty remarks into your ear.
- **Smart Alternatives:** If an item is over budget, JARVIS instantly suggests cheaper alternatives or nearby deals.
- **Semantic Memory:** Every scan is logged via [Backboard.io](http://Backboard.io) to a Caregiver/Personal Dashboard for long-term financial tracking.

---

### **🛠️ Tech Stack**

- **Frontend:** React Native (Expo) - Forced Landscape HUD with Glassmorphic UI.
- **On-Device AI:** MediaPipe (Hand Landmarking & Gesture Detection).
- **Backend:** Python (FastAPI) + ngrok.
- **Brain:** Gemini 2.0 Flash (Vision & Reasoning).
- **Voice:** ElevenLabs (Neural TTS).
- **Memory:** [Backboard.io](http://Backboard.io) (Cross-session semantic storage).

---

### **📸 HUD Interface**

- **Scanning Reticle:** Pulsing center-frame target.
- **Financial Ticker:** Real-time "Remaining Budget" display.
- **Decision Overlays:** **GREEN** (Affordable) vs. **RED** (Financial Risk).

---

### **🏁 Setup & Demo**

1. **Mobile:** Run `npx expo start` and open on iPhone.
2. **Backend:** Run `uvicorn main:app --reload` and start an `ngrok` tunnel to your local port.
3. **Demo:** Point the phone at a $5 coffee (Green) -> Point at a $2,000 Laptop (Red + Jarvis Voice Warning).

---

