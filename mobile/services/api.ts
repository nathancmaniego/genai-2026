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

export async function getScanHistory() {
  const res = await fetch(`${apiBaseUrl}/history`);
  return res.json();
}
