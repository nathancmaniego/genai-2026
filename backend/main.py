import io
import os
import json
import base64
import uuid
from datetime import datetime
from pathlib import Path

import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import google.generativeai as genai

load_dotenv()

app = FastAPI(title="C.H.U.D Brain", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCAN_LOG_PATH = Path("scan_log.json")
AUDIO_DIR = Path("audio_cache")
AUDIO_DIR.mkdir(exist_ok=True)

if not SCAN_LOG_PATH.exists():
    SCAN_LOG_PATH.write_text("[]")

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_MODEL_PATH = Path(__file__).parent / "hand_landmarker.task"
_base_options = mp_python.BaseOptions(model_asset_path=str(_MODEL_PATH))
_landmarker_options = mp_vision.HandLandmarkerOptions(
    base_options=_base_options,
    num_hands=1,
    min_hand_detection_confidence=0.7,
)
hands_detector = mp_vision.HandLandmarker.create_from_options(_landmarker_options)

FINGERTIP_IDS = [4, 8, 12, 16, 20]
MCP_IDS = [2, 5, 9, 13, 17]


SYSTEM_PROMPT = """You are C.H.U.D — Continuous Heads-Up Display — a sharp, deadpan AI financial advisor 
that lives inside a camera overlay. You analyze items people are looking at and deliver blunt, 
concise financial verdicts. Think dry wit, zero fluff, slight edge.

You MUST respond in valid JSON with exactly these fields:
{
  "item": "Name of the identified item",
  "estimated_price": 29.99,
  "analysis": "Two sentences. First: what the product is. Second: a sharp purchase insight.",
  "alternatives": [
    {"name": "Cheaper Option A", "price": 19.99},
    {"name": "Cheaper Option B", "price": 24.99}
  ],
  "voice_line": "A deadpan one-liner about the purchase decision"
}

Rules for analysis:
- Exactly 2 sentences. First sentence identifies the product briefly. Second sentence gives a purchase-relevant insight (value, durability, resale, hype tax, etc).
- Be concise and useful. No fluff.

Rules for alternatives:
- Provide 1-3 cheaper alternatives to the identified item.
- Each alternative must have a "name" and a "price" (float, 2 decimal places).
- Alternatives should be real, well-known products in the same category.
- If the item is already very cheap (under $5), return an empty array [].

Rules for the voice_line:
- If the user CAN afford it: curt approval. Example: "Green light. Your budget survives another day."
- If the user is BORDERLINE: dry warning. Example: "Technically possible. Technically so is skydiving without a parachute."
- If the user CANNOT afford it: blunt shutdown. Example: "Hard no. That purchase would make your savings account file for emotional damages."
- Keep it under 20 words. Be deadpan. Be sharp. No exclamation marks. Ever.

Price estimation rules:
- Use your knowledge to estimate a realistic retail price for the item
- If you see a price tag in the image, use that exact price
- Round to 2 decimal places
"""


class BudgetData(BaseModel):
    daily_fun_budget: float
    current_balance: float
    monthly_income: float
    fixed_costs: float
    savings_goal: float


class AnalyzeRequest(BaseModel):
    image: str
    budget: BudgetData


class InitializeRequest(BaseModel):
    monthlyIncome: float
    fixedCosts: float
    savingsGoal: float
    dailyFunBudget: float
    currentBalance: float


@app.get("/")
async def root():
    return {"status": "online", "service": "C.H.U.D Brain v1.0"}


@app.post("/initialize")
async def initialize_budget(req: InitializeRequest):
    return {
        "status": "initialized",
        "daily_fun_budget": req.dailyFunBudget,
        "message": f"Budget calibrated. Daily limit: ${req.dailyFunBudget:.2f}",
    }


class GestureRequest(BaseModel):
    image: str


@app.post("/gesture")
async def detect_gesture(req: GestureRequest):
    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    np_image = np.array(image)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np_image)

    results = hands_detector.detect(mp_image)

    if not results.hand_landmarks:
        return {"gesture": "none", "palm_open": False}

    landmarks = results.hand_landmarks[0]
    fingers_up = sum(
        1 for tip, mcp in zip(FINGERTIP_IDS, MCP_IDS)
        if landmarks[tip].y < landmarks[mcp].y
    )

    palm_open = fingers_up >= 4

    return {
        "gesture": "open_palm" if palm_open else "fist",
        "palm_open": palm_open,
    }


class ScanRequest(BaseModel):
    image: str


@app.post("/scan")
async def scan_image(req: ScanRequest):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content(
        [
            "One short paragraph only. Identify the item, give one price (e.g. $X or $X–$Y), "
            "one sentence on value, and 1–2 cheaper alternatives with prices. "
            "Max 3–4 lines total. No bullet lists, no headers, no intro. Plain prose.",
            {"mime_type": "image/jpeg", "data": image_bytes},
        ]
    )

    result_text = response.text.strip()
    print(f"[SCAN] Gemini response ({len(result_text)} chars):\n{result_text}\n---")
    return {"text": result_text}


@app.post("/analyze")
async def analyze_frame(req: AnalyzeRequest):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    budget_context = (
        f"User's daily fun budget: ${req.budget.daily_fun_budget:.2f}. "
        f"Current remaining balance today: ${req.budget.current_balance:.2f}. "
        f"Monthly income: ${req.budget.monthly_income:.2f}. "
        f"Fixed costs: ${req.budget.fixed_costs:.2f}. "
        f"Savings goal: ${req.budget.savings_goal:.2f}."
    )

    model = genai.GenerativeModel("google/gemma-3-1b-it")

    response = model.generate_content(
        [
            SYSTEM_PROMPT,
            f"\n\nUser's financial context: {budget_context}\n\n"
            "Analyze this image. Identify the main item, estimate its price, "
            "and determine if the user can afford it based on their CURRENT BALANCE (not daily budget). "
            "Respond ONLY with the JSON object.",
            {"mime_type": "image/jpeg", "data": image_bytes},
        ]
    )

    try:
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        ai_result = json.loads(text)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {response.text}")

    item_name = ai_result.get("item", "Unknown Item")
    estimated_price = float(ai_result.get("estimated_price", 0))
    voice_line = ai_result.get("voice_line", "No comment.")
    analysis = ai_result.get("analysis", "")
    raw_alternatives = ai_result.get("alternatives", [])
    alternatives = [
        {"name": a.get("name", ""), "price": float(a.get("price", 0))}
        for a in raw_alternatives
        if isinstance(a, dict) and a.get("name")
    ]

    can_afford = req.budget.current_balance >= estimated_price
    funds_remaining = req.budget.current_balance - estimated_price

    if can_afford and estimated_price < req.budget.current_balance * 0.5:
        severity = "green"
    elif can_afford:
        severity = "yellow"
    else:
        severity = "red"

    audio_url = None
    try:
        audio_url = await generate_voice(voice_line)
    except Exception:
        pass

    log_scan(item_name, estimated_price, can_afford, severity, voice_line)

    return {
        "item": item_name,
        "estimatedPrice": estimated_price,
        "canAfford": can_afford,
        "fundsRemaining": round(funds_remaining, 2),
        "voiceLine": voice_line,
        "analysis": analysis,
        "alternatives": alternatives,
        "audioUrl": audio_url,
        "severity": severity,
    }


async def generate_voice(text: str) -> str | None:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return None

    from elevenlabs import ElevenLabs

    client = ElevenLabs(api_key=api_key)
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")

    audio_generator = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_turbo_v2",
    )

    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = AUDIO_DIR / filename
    with open(filepath, "wb") as f:
        for chunk in audio_generator:
            f.write(chunk)

    return f"/audio/{filename}"


@app.get("/audio/{filename}")
async def serve_audio(filename: str):
    filepath = AUDIO_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(filepath, media_type="audio/mpeg")


def log_scan(
    item: str,
    price: float,
    can_afford: bool,
    severity: str,
    voice_line: str,
):
    try:
        logs = json.loads(SCAN_LOG_PATH.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        logs = []

    logs.append(
        {
            "id": uuid.uuid4().hex[:8],
            "timestamp": datetime.now().isoformat(),
            "item": item,
            "estimated_price": price,
            "can_afford": can_afford,
            "severity": severity,
            "voice_line": voice_line,
        }
    )

    SCAN_LOG_PATH.write_text(json.dumps(logs, indent=2))


@app.get("/history")
async def get_history():
    try:
        logs = json.loads(SCAN_LOG_PATH.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        logs = []
    return {"scans": logs, "total": len(logs)}


@app.delete("/history")
async def clear_history():
    SCAN_LOG_PATH.write_text("[]")
    return {"status": "cleared"}
