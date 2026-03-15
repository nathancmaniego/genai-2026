import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import ProgressHeader from '@/components/onboarding/ProgressHeader';
import ChipSelector from '@/components/onboarding/ChipSelector';
import ScaleSelector from '@/components/onboarding/ScaleSelector';
import StepContainer from '@/components/onboarding/StepContainer';

const WARNING_OPTIONS = [
  'This is over budget',
  'This will slow down your savings goal',
  'A cheaper option exists',
  'You bought similar things recently',
  'This is affordable',
];

const LIKELIHOOD_LABELS = ['Very unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very likely'];

const TONE_OPTIONS = ['Funny', 'Supportive', 'Straight to the point', 'Strict', 'Motivational'];

const INTERVENTION_OPTIONS = [
  'For every purchase',
  'Only for non-essential purchases',
  'Only when I go over budget',
  'Only for purchases above a certain amount',
];

export default function PersonalizeScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();

  const [warning, setWarning] = useState<string[]>([]);
  const [likelihood, setLikelihood] = useState<number | null>(null);
  const [tone, setTone] = useState<string[]>([]);
  const [intervention, setIntervention] = useState<string[]>([]);

  const canContinue =
    warning.length === 1 &&
    likelihood !== null &&
    tone.length === 1 &&
    intervention.length === 1;

  const handleContinue = () => {
    updateProfile({
      preferredWarningType: warning[0],
      riskAlertLikelihood: likelihood!,
      chudTone: tone[0],
      interventionPreference: intervention[0],
    });
    router.push('/onboarding/complete');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={6} totalSteps={7} onBack={() => router.back()} />
      <StepContainer canContinue={canContinue} onContinue={handleContinue}>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
          Personalize C.H.U.D
        </Animated.Text>

        {/* Warning type */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.block}>
          <Text style={styles.question}>
            What kind of warning would help you most in the moment?
          </Text>
          <ChipSelector
            options={WARNING_OPTIONS}
            selected={warning}
            onToggle={(o) => setWarning((prev) => (prev.includes(o) ? [] : [o]))}
            maxSelect={1}
          />
        </Animated.View>

        {/* Likelihood */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.block}>
          <Text style={styles.question}>
            How likely are you to listen if C.H.U.D tells you a purchase is risky?
          </Text>
          <ScaleSelector
            labels={LIKELIHOOD_LABELS}
            selected={likelihood}
            onSelect={setLikelihood}
          />
        </Animated.View>

        {/* Tone */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.block}>
          <Text style={styles.question}>What tone should C.H.U.D use?</Text>
          <ChipSelector
            options={TONE_OPTIONS}
            selected={tone}
            onToggle={(o) => setTone((prev) => (prev.includes(o) ? [] : [o]))}
            maxSelect={1}
          />
        </Animated.View>

        {/* Intervention */}
        <Animated.View entering={FadeInDown.duration(400).delay(650)} style={styles.block}>
          <Text style={styles.question}>When should C.H.U.D step in?</Text>
          <ChipSelector
            options={INTERVENTION_OPTIONS}
            selected={intervention}
            onToggle={(o) => setIntervention((prev) => (prev.includes(o) ? [] : [o]))}
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
