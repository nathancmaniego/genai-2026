import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OnboardingStep from '@/components/OnboardingStep';

export default function SavingsScreen() {
  const [value, setValue] = useState('');
  const router = useRouter();
  const { income, costs } = useLocalSearchParams<{ income: string; costs: string }>();

  return (
    <OnboardingStep
      step={2}
      totalSteps={3}
      icon="shield-outline"
      title="Savings Goal"
      description="What's your minimum savings target per month? Your financial safety net."
      value={value}
      onChangeText={setValue}
      placeholder="500"
      canAdvance={!!value && parseFloat(value) >= 0}
      onBack={() => router.back()}
      onNext={() =>
        router.push({
          pathname: '/onboarding/summary',
          params: { income, costs, savings: value },
        })
      }
    />
  );
}
