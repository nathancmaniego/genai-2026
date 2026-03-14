import { useState } from 'react';
import { useRouter } from 'expo-router';
import OnboardingStep from '@/components/OnboardingStep';

export default function IncomeScreen() {
  const [value, setValue] = useState('');
  const router = useRouter();

  return (
    <OnboardingStep
      step={0}
      totalSteps={3}
      label="income"
      title="Monthly take-home"
      description="After taxes, before any expenses. The number that hits your account."
      value={value}
      onChangeText={setValue}
      placeholder="4500"
      canAdvance={!!value && parseFloat(value) > 0}
      onBack={() => router.back()}
      onNext={() =>
        router.push({
          pathname: '/onboarding/costs',
          params: { income: value },
        })
      }
    />
  );
}
