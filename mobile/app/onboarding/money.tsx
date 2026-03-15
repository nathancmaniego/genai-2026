import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import CurrencyInputField from '@/components/onboarding/CurrencyInputField';
import StepContainer from '@/components/onboarding/StepContainer';

export default function MoneyScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [flexible, setFlexible] = useState('');
  const [discretionary, setDiscretionary] = useState('');

  const canContinue =
    !!income && parseFloat(income) > 0 &&
    !!savings && parseFloat(savings) > 0 &&
    !!flexible && parseFloat(flexible) > 0;

  const handleContinue = () => {
    updateProfile({
      monthlyIncome: parseFloat(income),
      monthlySavingsGoal: parseFloat(savings),
      monthlyFlexibleSpending: parseFloat(flexible),
      monthlyDiscretionaryBudget: discretionary ? parseFloat(discretionary) : 0,
    });
    router.push('/onboarding/savings-goal');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={1} totalSteps={7} onBack={() => router.back()} />
      <StepContainer canContinue={canContinue} onContinue={handleContinue}>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
          Monthly money snapshot
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.hint}>
          Rough estimates are perfectly fine.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <CurrencyInputField
            label="How much money do you usually get each month?"
            helper="Just estimate your average monthly income."
            value={income}
            onChangeText={setIncome}
            placeholder="2500"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <CurrencyInputField
            label="How much do you want to save each month?"
            helper="Enter your monthly savings target."
            value={savings}
            onChangeText={setSavings}
            placeholder="500"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <CurrencyInputField
            label="After bills and essentials, how much spending money do you usually have left?"
            helper="Estimate what is left for non-essential spending."
            value={flexible}
            onChangeText={setFlexible}
            placeholder="300"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(600)}>
          <CurrencyInputField
            label="How much do you set aside monthly for bigger purchases?"
            helper="Optional — for electronics, luxury items, and one-off buys."
            value={discretionary}
            onChangeText={setDiscretionary}
            placeholder="200"
          />
        </Animated.View>
      </StepContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
  },
});
