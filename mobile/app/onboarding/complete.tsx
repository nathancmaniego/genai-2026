import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';
import { useBudget } from '@/context/BudgetContext';
import { buildBudgetProfile } from '@/types/profile';
import { saveUserProfile } from '@/services/storage';
import { initializeBudget } from '@/services/api';
import ProgressHeader from '@/components/onboarding/ProgressHeader';

export default function CompleteScreen() {
  const router = useRouter();
  const { getProfile } = useOnboarding();
  const { setProfile } = useBudget();
  const [loading, setLoading] = useState(false);

  const profile = getProfile();
  const budget = buildBudgetProfile(profile);

  const handleLaunch = async () => {
    setLoading(true);

    await saveUserProfile(profile);
    await setProfile(budget);

    try {
      await initializeBudget(budget);
    } catch {
      // Backend may not be running
    }

    router.replace('/hud');
  };

  return (
    <View style={styles.root}>
      <ProgressHeader step={7} totalSteps={7} onBack={() => router.back()} />

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.check}>
          <Text style={styles.checkMark}>{'\u2713'}</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(500).delay(350)} style={styles.title}>
          C.H.U.D is calibrated
        </Animated.Text>

        <Animated.Text entering={FadeInDown.duration(500).delay(450)} style={styles.subtitle}>
          You're ready to scan smarter.
        </Animated.Text>

        {/* Summary */}
        <Animated.View entering={FadeInDown.duration(500).delay(600)} style={styles.summary}>
          <SummaryRow label="daily budget" value={`$${budget.dailyFunBudget.toFixed(2)}`} accent />
          <SummaryRow label="saving for" value={profile.primarySavingsGoal} />
          <SummaryRow label="tone" value={profile.chudTone} />
          <SummaryRow label="intervene" value={profile.interventionPreference} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(900)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleLaunch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'launching...' : 'launch c.h.u.d'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, accent && summaryStyles.valueAccent]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '60%',
  },
  valueAccent: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginBottom: Spacing.lg,
    ...superellipse(Radii.lg),
  },
  checkMark: {
    fontSize: 28,
    color: Colors.bg,
    fontWeight: '800',
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  summary: {
    marginTop: Spacing.xl,
    width: '100%',
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    ...superellipse(Radii.xl),
  },
  bottomWrap: {
    paddingBottom: 50,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 18,
    ...superellipse(Radii.lg),
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  buttonText: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.bg,
    letterSpacing: 1,
  },
});
