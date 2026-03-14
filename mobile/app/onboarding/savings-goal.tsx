import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import ChipSelector from '@/components/onboarding/ChipSelector';
import StepContainer from '@/components/onboarding/StepContainer';

const OPTIONS = [
  'Emergency fund',
  'School / tuition',
  'Travel',
  'Rent / living costs',
  'Investing',
  'Big purchase',
  'Other',
];

export default function SavingsGoalScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    setSelected([option]);
  };

  const handleContinue = () => {
    updateProfile({ primarySavingsGoal: selected[0] });
    router.push('/onboarding/behavior');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={2} totalSteps={7} onBack={() => router.back()} />
      <StepContainer canContinue={selected.length === 1} onContinue={handleContinue}>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
          Savings goal
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.question}>
          What are you mainly saving for right now?
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <ChipSelector
            options={OPTIONS}
            selected={selected}
            onToggle={handleToggle}
            maxSelect={1}
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
  question: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -Spacing.sm,
  },
});
