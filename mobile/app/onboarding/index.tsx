import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.accent} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(800).delay(400)} style={styles.title}>
        Welcome to JARVIS
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(800).delay(600)} style={styles.subtitle}>
        Your proactive financial guardian.{'\n'}
        Let's calibrate your spending profile so I can protect your wallet in real time.
      </Animated.Text>

      <Animated.View entering={FadeInUp.duration(800).delay(900)} style={styles.features}>
        <FeatureRow icon="eye-outline" text="See what you're looking at" />
        <FeatureRow icon="calculator-outline" text="Know if you can afford it" />
        <FeatureRow icon="mic-outline" text="Get witty voice advice" />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(1200)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/income')}
        >
          <Text style={styles.buttonText}>Calibrate My Profile</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.bg} />
        </Pressable>

        <Text style={styles.disclaimer}>
          This data stays on your device. No bank connections required.
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureDot}>
        <Ionicons name={icon as any} size={20} color={Colors.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accentDim,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  features: {
    marginTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.bg,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
