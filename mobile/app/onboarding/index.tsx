import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.badge}>
        <Text style={styles.badgeText}>C.H.U.D</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(700).delay(400)} style={styles.title}>
        Continuous{'\n'}Heads-Up{'\n'}Display
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(700).delay(600)} style={styles.subtitle}>
        Calibrate your spending limits.{'\n'}
        Point at anything. Know instantly.
      </Animated.Text>

      <Animated.View entering={FadeInUp.duration(700).delay(900)} style={styles.features}>
        <FeatureRow label="01" text="Identify items in frame" />
        <FeatureRow label="02" text="Estimate price in real-time" />
        <FeatureRow label="03" text="Verdict against your budget" />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(1200)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/income')}
        >
          <Text style={styles.buttonText}>begin calibration</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          all data stored locally on device
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingTop: 100,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: Spacing.xl,
    ...superellipse(Radii.sm),
  },
  badgeText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.bg,
    letterSpacing: 2,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    lineHeight: 22,
  },
  features: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  featureLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
    width: 28,
  },
  featureText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 18,
    width: '100%',
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
  disclaimer: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    letterSpacing: 0.5,
  },
});
