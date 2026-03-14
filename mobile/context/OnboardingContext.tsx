import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserProfile, DEFAULT_USER_PROFILE } from '@/types/profile';

interface OnboardingContextType {
  data: Partial<UserProfile>;
  updateProfile: (fields: Partial<UserProfile>) => void;
  getProfile: () => UserProfile;
}

const OnboardingContext = createContext<OnboardingContextType>({
  data: {},
  updateProfile: () => {},
  getProfile: () => DEFAULT_USER_PROFILE,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Partial<UserProfile>>({});

  const updateProfile = useCallback((fields: Partial<UserProfile>) => {
    setData((prev) => ({ ...prev, ...fields }));
  }, []);

  const getProfile = useCallback((): UserProfile => {
    return { ...DEFAULT_USER_PROFILE, ...data };
  }, [data]);

  return (
    <OnboardingContext.Provider value={{ data, updateProfile, getProfile }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
