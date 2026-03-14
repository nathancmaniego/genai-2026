import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OnboardingStep from '@/components/OnboardingStep';

export default function CostsScreen() {
  const [value, setValue] = useState('');
  const router = useRouter();
  const { income } = useLocalSearchParams<{ income: string }>();

  return (
    <OnboardingStep
      step={1}
      totalSteps={3}
      label="fixed costs"
      title="Monthly obligations"
      description="Rent, utilities, subscriptions, insurance. Everything that auto-drafts."
      value={value}
      onChangeText={setValue}
      placeholder="2200"
      canAdvance={!!value && parseFloat(value) > 0}
      onBack={() => router.back()}
      onNext={() =>
        router.push({
          pathname: '/onboarding/savings',
          params: { income, costs: value },
        })
      }
    />
  );
}
