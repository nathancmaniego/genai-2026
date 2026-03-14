import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/profile';

const KEYS = {
  ONBOARDED: 'chud_onboarded',
  BUDGET: 'chud_budget',
  API_URL: 'chud_api_url',
  USER_PROFILE: 'chud_user_profile',
};

export interface BudgetProfile {
  monthlyIncome: number;
  fixedCosts: number;
  savingsGoal: number;
  dailyFunBudget: number;
  currentBalance: number;
  voiceId?: string;
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
  await AsyncStorage.multiRemove([KEYS.ONBOARDED, KEYS.BUDGET, KEYS.USER_PROFILE]);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function updateBalance(newBalance: number): Promise<void> {
  const profile = await getBudgetProfile();
  if (profile) {
    profile.currentBalance = newBalance;
    await AsyncStorage.setItem(KEYS.BUDGET, JSON.stringify(profile));
  }
}

export async function saveApiUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_URL, url);
}

export async function getApiUrl(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_URL);
}
