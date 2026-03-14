import Constants from 'expo-constants';
import { BudgetProfile } from './storage';

function getDevServerUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
}

const BASE_URL = getDevServerUrl();

let apiBaseUrl = BASE_URL;

export function getApiBaseUrl() {
  return apiBaseUrl;
}

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
  gesture: 'open_palm' | 'fist' | 'none';
  palm_open: boolean;
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

export async function getScanHistory() {
  const res = await fetch(`${apiBaseUrl}/history`);
  return res.json();
}
