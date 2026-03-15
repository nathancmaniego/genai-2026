import { BudgetProfile } from './storage';

const BASE_URL = 'http://localhost:8000';

let apiBaseUrl = BASE_URL;

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url;
}

export async function initializeBudget(profile: BudgetProfile) {
  const res = await fetch(`${apiBaseUrl}/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  return res.json();
}

export interface Alternative {
  name: string;
  price: number;
}

export interface AnalyzeResponse {
  item: string;
  estimatedPrice: number;
  canAfford: boolean;
  fundsRemaining: number;
  voiceLine: string;
  analysis: string;
  alternatives: Alternative[];
  audioUrl: string | null;
  severity: 'green' | 'yellow' | 'red';
}

export async function analyzeFrame(
  base64Image: string,
  budget: BudgetProfile
): Promise<AnalyzeResponse> {
  const res = await fetch(`${apiBaseUrl}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64Image,
      budget: {
        daily_fun_budget: budget.dailyFunBudget,
        current_balance: budget.currentBalance,
        monthly_income: budget.monthlyIncome,
        fixed_costs: budget.fixedCosts,
        savings_goal: budget.savingsGoal,
      },
    }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export interface GestureResponse {
  gesture: 'open_palm' | 'thumbs_up' | 'thumbs_down' | 'fist' | 'none';
  palm_open: boolean;
  thumbs_up: boolean;
  thumbs_down: boolean;
}

export async function detectGesture(
  base64Image: string
): Promise<GestureResponse> {
  const res = await fetch(`${apiBaseUrl}/gesture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!res.ok) throw new Error(`Gesture error: ${res.status}`);
  return res.json();
}

export interface ScanResponse {
  text: string;
  estimatedPrice: number | null;
}

export async function scanImage(
  base64Image: string
): Promise<ScanResponse> {
  const res = await fetch(`${apiBaseUrl}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!res.ok) throw new Error(`Scan error: ${res.status}`);
  const data = await res.json();
  return {
    text: (data?.text != null) ? String(data.text) : '',
    estimatedPrice: data?.estimated_price ?? null,
  };
}

export async function getScanHistory() {
  const res = await fetch(`${apiBaseUrl}/history`);
  return res.json();
}
