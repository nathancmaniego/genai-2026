import { BudgetProfile, calculateDailyFunBudget } from '@/services/storage';

export interface UserProfile {
  monthlyIncome: number;
  monthlySavingsGoal: number;
  monthlyFlexibleSpending: number;
  primarySavingsGoal: string;
  impulseFrequency: number;
  smallPurchaseCreep: number;
  budgetAwareness: number;
  overspendingTriggers: string[];
  impulseCategories: string[];
  preferredWarningType: string;
  riskAlertLikelihood: number;
  chudTone: string;
  interventionPreference: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  monthlyIncome: 0,
  monthlySavingsGoal: 0,
  monthlyFlexibleSpending: 0,
  primarySavingsGoal: '',
  impulseFrequency: -1,
  smallPurchaseCreep: -1,
  budgetAwareness: -1,
  overspendingTriggers: [],
  impulseCategories: [],
  preferredWarningType: '',
  riskAlertLikelihood: -1,
  chudTone: '',
  interventionPreference: '',
};

export function buildBudgetProfile(p: UserProfile): BudgetProfile {
  const fixedCosts = p.monthlyIncome - p.monthlyFlexibleSpending - p.monthlySavingsGoal;
  const dailyFunBudget = calculateDailyFunBudget(
    p.monthlyIncome,
    Math.max(0, fixedCosts),
    p.monthlySavingsGoal
  );

  return {
    monthlyIncome: p.monthlyIncome,
    fixedCosts: Math.max(0, fixedCosts),
    savingsGoal: p.monthlySavingsGoal,
    dailyFunBudget,
    currentBalance: dailyFunBudget,
    voiceId: '',
  };
}
