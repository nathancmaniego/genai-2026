import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BudgetProfile,
  getBudgetProfile,
  saveBudgetProfile,
  updateBalance as updateStoredBalance,
  resetOnboarding,
} from '@/services/storage';

interface BudgetContextType {
  profile: BudgetProfile | null;
  loading: boolean;
  setProfile: (profile: BudgetProfile) => Promise<void>;
  deductFromBalance: (amount: number) => Promise<void>;
  resetBalance: () => Promise<void>;
  clearProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType>({
  profile: null,
  loading: true,
  setProfile: async () => {},
  deductFromBalance: async () => {},
  resetBalance: async () => {},
  clearProfile: async () => {},
  refreshProfile: async () => {},
});

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<BudgetProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const stored = await getBudgetProfile();
    setProfileState(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const setProfile = useCallback(async (p: BudgetProfile) => {
    await saveBudgetProfile(p);
    setProfileState(p);
  }, []);

  const deductFromBalance = useCallback(
    async (amount: number) => {
      if (!profile) return;
      const newBalance = Math.max(0, profile.currentBalance - amount);
      await updateStoredBalance(newBalance);
      setProfileState((prev) => (prev ? { ...prev, currentBalance: newBalance } : null));
    },
    [profile]
  );

  const resetBalance = useCallback(async () => {
    if (!profile) return;
    await updateStoredBalance(profile.dailyFunBudget);
    setProfileState((prev) =>
      prev ? { ...prev, currentBalance: prev.dailyFunBudget } : null
    );
  }, [profile]);

  const clearProfile = useCallback(async () => {
    await resetOnboarding();
    setProfileState(null);
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        profile,
        loading,
        setProfile,
        deductFromBalance,
        resetBalance,
        clearProfile,
        refreshProfile,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  return useContext(BudgetContext);
}
