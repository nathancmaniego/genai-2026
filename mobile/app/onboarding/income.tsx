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
      icon="wallet-outline"
      title="Monthly Income"
      description="What is your monthly take-home pay? After taxes, before expenses."
      value={value}
      onChangeText={setValue}
      placeholder="4,500"
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
