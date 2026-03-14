import os
import json
import base64
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import google.generativeai as genai

load_dotenv()

app = FastAPI(title="JARVIS Brain", version="1.0.0")

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

JARVIS_SYSTEM_PROMPT = """You are JARVIS, a witty and sophisticated AI financial guardian — think Tony Stark's butler, 
but for wallets. You analyze items people are looking at through their camera and provide a financial assessment.

You MUST respond in valid JSON with exactly these fields:
{
  "item": "Name of the identified item",
  "estimated_price": 29.99,
  "voice_line": "A witty, Jarvis-style one-liner about the purchase decision"
}

Rules for the voice_line:
- If the user CAN afford it: be encouraging but subtly witty. Example: "A fine choice, sir. Your wallet breathes a sigh of relief."
- If the user is BORDERLINE: be cautious with dry humor. Example: "Technically feasible, sir, though your savings account just raised an eyebrow."
- If the user CANNOT afford it: be protective with sharp wit. Example: "Sir, your wallet says no, but your ego says yes. I suggest the latter stays quiet."
- Keep it under 25 words. Be British. Be dry. Be iconic.

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
    return {"status": "online", "service": "JARVIS Brain v1.0"}


@app.post("/initialize")
async def initialize_budget(req: InitializeRequest):
    return {
        "status": "initialized",
        "daily_fun_budget": req.dailyFunBudget,
        "message": f"Budget persona calibrated. Daily fun budget: ${req.dailyFunBudget:.2f}",
    }


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

    model = genai.GenerativeModel("gemini-2.0-flash")

    response = model.generate_content(
        [
            JARVIS_SYSTEM_PROMPT,
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
    voice_line = ai_result.get("voice_line", "No comment, sir.")

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
        pass  # Voice is optional — don't fail the whole scan

    log_scan(item_name, estimated_price, can_afford, severity, voice_line)

    return {
        "item": item_name,
        "estimatedPrice": estimated_price,
        "canAfford": can_afford,
        "fundsRemaining": round(funds_remaining, 2),
        "voiceLine": voice_line,
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
