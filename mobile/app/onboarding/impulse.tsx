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
  'Coffee / drinks',
  'Food / snacks',
  'Clothes',
  'Tech',
  'Beauty / self-care',
  'Accessories',
  'Rides / transport',
  'Other',
];

export default function ImpulseScreen() {
  const router = useRouter();
  const { updateProfile } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleContinue = () => {
    updateProfile({ impulseCategories: selected });
    router.push('/onboarding/personalize');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={5} totalSteps={7} onBack={() => router.back()} />
      <StepContainer canContinue={selected.length >= 1} onContinue={handleContinue}>
        <Animated.Text entering={FadeInDown.duration(400).delay(100)} style={styles.title}>
          Impulse categories
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(200)} style={styles.question}>
          What do you impulse buy most often? Pick up to 3.
        </Animated.Text>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <ChipSelector
            options={OPTIONS}
            selected={selected}
            onToggle={handleToggle}
            maxSelect={3}
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
