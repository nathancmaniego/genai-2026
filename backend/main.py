import io
import logging
import os
import json
import base64
import time
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

import google.generativeai as genai

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Railtown: when RAILTOWN_API_KEY is set, Python logging is sent to Conductr
try:
    import railtownai
    if os.getenv("RAILTOWN_API_KEY"):
        railtownai.init(os.getenv("RAILTOWN_API_KEY"))
except Exception:
    pass

app = FastAPI(title="C.H.U.D Brain", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limit: (ip, endpoint) -> list of request timestamps (sliding window)
_rate_limit_window_sec = 60
_rate_limit_max = 30  # max requests per window per IP per endpoint
_rate_limit_store: dict[tuple[str, str], list[float]] = defaultdict(list)


def _rate_limit_key(ip: str, endpoint: str) -> tuple[str, str]:
    return (ip or "unknown", endpoint)


def _check_rate_limit(ip: str, endpoint: str) -> None:
    now = time.monotonic()
    key = _rate_limit_key(ip, endpoint)
    times = _rate_limit_store[key]
    # drop timestamps outside window
    cutoff = now - _rate_limit_window_sec
    while times and times[0] < cutoff:
        times.pop(0)
    if len(times) >= _rate_limit_max:
        logger.warning("Rate limit exceeded", extra={"ip": ip, "endpoint": endpoint})
        raise HTTPException(status_code=429, detail="Too many requests. Try again in a minute.")
    times.append(now)


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
        return {"gesture": "none", "palm_open": False, "thumbs_up": False, "thumbs_down": False}

    landmarks = results.hand_landmarks[0]

    NON_THUMB_TIPS = [8, 12, 16, 20]
    NON_THUMB_MCPS = [5, 9, 13, 17]

    fingers_up = sum(
        1 for tip, mcp in zip(FINGERTIP_IDS, MCP_IDS)
        if landmarks[tip].y < landmarks[mcp].y
    )
    palm_open = fingers_up >= 4

    other_fingers_curled = all(
        landmarks[tip].y >= landmarks[mcp].y
        for tip, mcp in zip(NON_THUMB_TIPS, NON_THUMB_MCPS)
    )

    thumb_up = landmarks[4].y < landmarks[3].y
    thumb_down = landmarks[4].y > landmarks[3].y

    thumbs_up = thumb_up and other_fingers_curled and not palm_open
    thumbs_down = thumb_down and other_fingers_curled and not palm_open

    if palm_open:
        gesture = "open_palm"
    elif thumbs_up:
        gesture = "thumbs_up"
    elif thumbs_down:
        gesture = "thumbs_down"
    else:
        gesture = "fist"

    return {
        "gesture": gesture,
        "palm_open": palm_open,
        "thumbs_up": thumbs_up,
        "thumbs_down": thumbs_down,
    }


class ScanCalibration(BaseModel):
    monthlyIncome: float = 0
    monthlySavingsGoal: float = 0
    monthlyFlexibleSpending: float = 0
    monthlyDiscretionaryBudget: float = 0
    primarySavingsGoal: str = ""
    impulseFrequency: int = -1
    smallPurchaseCreep: int = -1
    budgetAwareness: int = -1
    overspendingTriggers: list[str] = Field(default_factory=list)
    impulseCategories: list[str] = Field(default_factory=list)
    preferredWarningType: str = ""
    riskAlertLikelihood: int = -1
    chudTone: str = ""
    interventionPreference: str = ""


class ScanRequest(BaseModel):
    image: str
    calibration: ScanCalibration | None = None


FREQUENCY_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Very often"]
AWARENESS_LABELS = ["Not at all", "A little", "Somewhat", "Mostly", "Very aware"]
LIKELIHOOD_LABELS = ["Very unlikely", "Unlikely", "Neutral", "Likely", "Very likely"]


def _label_for_index(value: int, labels: list[str]) -> str | None:
    if 0 <= value < len(labels):
        return labels[value]
    return None


def _join_values(values: list[str]) -> str:
    return ", ".join(values)


def _build_scan_calibration_context(calibration: ScanCalibration | None) -> str:
    if calibration is None:
        return "No user calibration was provided."

    details: list[str] = []

    if calibration.monthlyFlexibleSpending > 0:
        daily_budget = round(calibration.monthlyFlexibleSpending / 30, 2)
        details.append(
            f"Daily budget for essential / day-to-day purchases (e.g. food, coffee, small daily items): ~${daily_budget:.2f} per day."
        )
    if calibration.monthlyDiscretionaryBudget > 0:
        details.append(
            f"Monthly budget for non-essential / discretionary purchases (e.g. electronics, luxury, one-off bigger buys): ${calibration.monthlyDiscretionaryBudget:.2f} per month."
        )
    elif calibration.monthlyFlexibleSpending > 0:
        details.append(
            f"Monthly budget for non-essential / discretionary purchases (e.g. electronics, luxury, one-off bigger buys): ${calibration.monthlyFlexibleSpending:.2f} per month."
        )
    if calibration.primarySavingsGoal:
        details.append(f"Primary savings goal: {calibration.primarySavingsGoal}.")
    if calibration.monthlySavingsGoal > 0:
        details.append(f"Monthly savings target: ${calibration.monthlySavingsGoal:.2f}.")
    if calibration.preferredWarningType:
        details.append(f"Preferred warning type: {calibration.preferredWarningType}.")
    if calibration.chudTone:
        details.append(f"Preferred tone: {calibration.chudTone}.")
    if calibration.interventionPreference:
        details.append(f"Intervention preference: {calibration.interventionPreference}.")
    if calibration.impulseCategories:
        details.append(
            f"Common impulse-buy categories: {_join_values(calibration.impulseCategories)}."
        )
    if calibration.overspendingTriggers:
        details.append(
            f"Common overspending triggers: {_join_values(calibration.overspendingTriggers)}."
        )

    impulse_frequency = _label_for_index(calibration.impulseFrequency, FREQUENCY_LABELS)
    if impulse_frequency:
        details.append(f"Impulse buying frequency: {impulse_frequency}.")

    purchase_creep = _label_for_index(calibration.smallPurchaseCreep, FREQUENCY_LABELS)
    if purchase_creep:
        details.append(f"Small purchases add up unexpectedly: {purchase_creep}.")

    budget_awareness = _label_for_index(calibration.budgetAwareness, AWARENESS_LABELS)
    if budget_awareness:
        details.append(f"Budget awareness while shopping: {budget_awareness}.")

    alert_likelihood = _label_for_index(calibration.riskAlertLikelihood, LIKELIHOOD_LABELS)
    if alert_likelihood:
        details.append(f"Likelihood they listen to a warning: {alert_likelihood}.")

    return " ".join(details) if details else "User calibration was provided but contains no preferences."


@app.post("/scan")
async def scan_image(request: Request, req: ScanRequest):
    _check_rate_limit(request.client.host if request.client else "unknown", "scan")
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    try:
        image_bytes = base64.b64decode(req.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    image = Image.open(io.BytesIO(image_bytes))
    w, h = image.size
    crop_ratio = 0.6
    cx, cy = w / 2, h / 2
    cw, ch = w * crop_ratio, h * crop_ratio
    cropped = image.crop((
        int(cx - cw / 2),
        int(cy - ch / 2),
        int(cx + cw / 2),
        int(cy + ch / 2),
    ))
    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=80)
    cropped_bytes = buf.getvalue()

    calibration_context = _build_scan_calibration_context(req.calibration)
    model = genai.GenerativeModel("gemini-2.5-flash")
    logger.info("Gemini scan request")
    response = model.generate_content(
        [
            "IMPORTANT: The image has been cropped to the center of the camera frame. "
            "Focus ONLY on the main product or item visible in the center of this image. "
            "Ignore any background items, shelves, or peripheral objects.\n\n"
            "Analyze this image and respond with ONLY a valid JSON object (no markdown, no code fences):\n"
            '{\n'
            '  "text": "One short paragraph. Identify the item, mention its price, '
            'give a personalized purchase insight using the user calibration when relevant, '
            'and include 1-2 cheaper alternatives with prices when they are genuinely helpful. '
            'Max 3-4 lines. Plain prose, no bullet lists, no headers.",\n'
            '  "estimated_price": 29.99,\n'
            '  "rating": "good",\n'
            '  "purchase_type": "daily"\n'
            '}\n\n'
            "User calibration for personalization:\n"
            f"{calibration_context}\n\n"
            "Rules for personalization:\n"
            "- Use the calibration to tailor the advice, not to restate the profile.\n"
            "- If the item matches the user's impulse-buy categories or spending triggers, call that out naturally.\n"
            "- Reflect the preferred warning type and tone in the wording.\n"
            "- Mention the savings goal only when it makes the recommendation sharper.\n"
            "- Do not invent purchase history or certainty you do not have.\n\n"
            "Rules for estimated_price:\n"
            "- If you can see a price tag in the image, use that exact price as a float.\n"
            "- If you can confidently identify the item and estimate its retail price, use that.\n"
            "- If you cannot determine a specific price, set estimated_price to null.\n"
            "- Always round to 2 decimal places when providing a price.\n\n"
            'Rules for purchase_type (required, exactly one of "daily" or "discretionary"):\n'
            '- "daily": food, coffee, groceries, routine small necessities, things people buy often within a day.\n'
            '- "discretionary": electronics, luxury items, one-off bigger purchases, non-essential wants e.g. a PS5 controller.\n\n'
            'Rules for rating (required, exactly one of "bad", "okay", or "good"):\n'
            '1. Use the purchase_type you chose above to pick the right budget:\n'
            '- For "daily" items: compare against the user\'s DAILY budget. Rate "bad" if it blows the day, "okay" if borderline, "good" if it fits.\n'
            '- For "discretionary" items: compare against the user\'s MONTHLY discretionary budget. Rate "bad" if it strains the month or is clearly impulsive, "okay" if borderline, "good" if it fits.\n'
            '2. Rating meanings:\n'
            '- "bad": Poor fit—over the relevant budget, conflicts with goals/triggers, or clearly impulsive.\n'
            '- "okay": Borderline—acceptable but not ideal for the relevant budget.\n'
            '- "good": Fits—aligned with the relevant budget and the user\'s profile.',
            {"mime_type": "image/jpeg", "data": cropped_bytes},
        ]
    )

    try:
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        scan_result = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        logger.warning("Gemini scan: failed to parse JSON, using raw text")
        return {"text": response.text.strip(), "estimated_price": None, "rating": "okay", "purchase_type": "daily"}

    result_text = scan_result.get("text", response.text.strip())
    estimated_price = scan_result.get("estimated_price")
    if estimated_price is not None:
        try:
            estimated_price = round(float(estimated_price), 2)
        except (ValueError, TypeError):
            estimated_price = None

    raw_rating = (scan_result.get("rating") or "okay").strip().lower()
    rating = raw_rating if raw_rating in ("bad", "okay", "good") else "okay"

    raw_purchase_type = (scan_result.get("purchase_type") or "daily").strip().lower()
    purchase_type = raw_purchase_type if raw_purchase_type in ("daily", "discretionary") else "daily"

    logger.info("Gemini scan ok", extra={"response_length": len(result_text), "estimated_price": estimated_price, "rating": rating, "purchase_type": purchase_type})
    return {"text": result_text, "estimated_price": estimated_price, "rating": rating, "purchase_type": purchase_type}


@app.post("/analyze")
async def analyze_frame(request: Request, req: AnalyzeRequest):
    _check_rate_limit(request.client.host if request.client else "unknown", "analyze")
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
    logger.info("Gemini analyze request")
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
        logger.exception("Gemini analyze: failed to parse response")
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
    logger.info("Gemini analyze ok", extra={"item": item_name, "severity": severity})

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
