import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDED: 'jarvis_onboarded',
  BUDGET: 'jarvis_budget',
};

export interface BudgetProfile {
  monthlyIncome: number;
  fixedCosts: number;
  savingsGoal: number;
  dailyFunBudget: number;
  currentBalance: number;
}

export function calculateDailyFunBudget(
  income: number,
  fixedCosts: number,
  savings: number
): number {
  const monthly = income - fixedCosts - savings;
  return Math.max(0, Math.round((monthly / 30) * 100) / 100);
}

export async function saveBudgetProfile(profile: BudgetProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.BUDGET, JSON.stringify(profile));
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function getBudgetProfile(): Promise<BudgetProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.BUDGET);
  return raw ? JSON.parse(raw) : null;
}

export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.ONBOARDED, KEYS.BUDGET]);
}

export async function updateBalance(newBalance: number): Promise<void> {
  const profile = await getBudgetProfile();
  if (profile) {
    profile.currentBalance = newBalance;
    await AsyncStorage.setItem(KEYS.BUDGET, JSON.stringify(profile));
  }
}
