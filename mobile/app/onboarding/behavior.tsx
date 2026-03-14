import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import ScaleSelector from '@/components/onboarding/ScaleSelector';
import StepContainer from '@/components/onboarding/StepContainer';

const FREQUENCY_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'];
const AWARENESS_LABELS = ['Not at all', 'A little', 'Somewhat', 'Mostly', 'Very aware'];

export default function BehaviorScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();
  const [impulse, setImpulse] = useState<number | null>(null);
  const [creep, setCreep] = useState<number | null>(null);
  const [awareness, setAwareness] = useState<number | null>(null);

  const canContinue = impulse !== null && creep !== null && awareness !== null;

  const handleContinue = () => {
    updateProfile({
      impulseFrequency: impulse!,
      smallPurchaseCreep: creep!,
      budgetAwareness: awareness!,
    });
    router.push('/onboarding/triggers');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={3} totalSteps={7} onBack={() => router.back()} />
      <StepContainer canContinue={canContinue} onContinue={handleContinue}>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
          Spending behavior
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.block}>
          <Text style={styles.question}>
            How often do you buy things you did not plan to buy?
          </Text>
          <ScaleSelector labels={FREQUENCY_LABELS} selected={impulse} onSelect={setImpulse} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.block}>
          <Text style={styles.question}>
            How often do small purchases add up more than you expect?
          </Text>
          <ScaleSelector labels={FREQUENCY_LABELS} selected={creep} onSelect={setCreep} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.block}>
          <Text style={styles.question}>
            How aware are you of your budget when deciding to buy something?
          </Text>
          <ScaleSelector labels={AWARENESS_LABELS} selected={awareness} onSelect={setAwareness} />
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
  block: {
    gap: Spacing.sm,
  },
  question: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
