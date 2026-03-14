import { BudgetProfile } from './storage';

const BASE_URL = 'http://localhost:8000';

let apiBaseUrl = BASE_URL;

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function resolveApiUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBaseUrl) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export function setApiBaseUrl(url: string) {
  apiBaseUrl = normalizeBaseUrl(url);
}

export async function initializeBudget(profile: BudgetProfile) {
  const res = await fetch(`${apiBaseUrl}/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monthlyIncome: profile.monthlyIncome,
      fixedCosts: profile.fixedCosts,
      savingsGoal: profile.savingsGoal,
      dailyFunBudget: profile.dailyFunBudget,
      currentBalance: profile.currentBalance,
    }),
  });
  return res.json();
}

export interface AnalyzeResponse {
  item: string;
  estimatedPrice: number;
  canAfford: boolean;
  fundsRemaining: number;
  voiceLine: string;
  audioUrl: string | null;
  severity: 'green' | 'yellow' | 'red';
}

export async function analyzeFrame(
  base64Image: string,
  budget: BudgetProfile
): Promise<AnalyzeResponse> {
  const body: Record<string, unknown> = {
    image: base64Image,
    budget: {
      daily_fun_budget: budget.dailyFunBudget,
      current_balance: budget.currentBalance,
      monthly_income: budget.monthlyIncome,
      fixed_costs: budget.fixedCosts,
      savings_goal: budget.savingsGoal,
    },
  };

  if (budget.voiceId?.trim()) {
    body.voiceId = budget.voiceId.trim();
  }

  const res = await fetch(`${apiBaseUrl}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const data: AnalyzeResponse = await res.json();
  return {
    ...data,
    audioUrl: resolveApiUrl(data.audioUrl),
  };
}

export async function getScanHistory() {
  const res = await fetch(`${apiBaseUrl}/history`);
  return res.json();
}
