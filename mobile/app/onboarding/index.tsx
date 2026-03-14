import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OnboardingWelcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.badge}>
        <Text style={styles.badgeText}>C.H.U.D</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(600).delay(400)} style={styles.title}>
        Meet C.H.U.D
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(600).delay(550)} style={styles.subtitle}>
        Your real-time financial guardrail
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(600).delay(700)} style={styles.body}>
        Answer a few quick questions so C.H.U.D can personalize when to warn you, what to say, and how to help you save money.
      </Animated.Text>

      <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/onboarding/money')}
        >
          <Text style={styles.buttonText}>get started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingTop: 120,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.accent,
    marginTop: Spacing.sm,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    lineHeight: 21,
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
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
