import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface Props {
  step: number;
  totalSteps: number;
  icon: string;
  title: string;
  description: string;
  value: string;
  onChangeText: (text: string) => void;
  onNext: () => void;
  onBack?: () => void;
  placeholder?: string;
  canAdvance: boolean;
}

export default function OnboardingStep({
  step,
  totalSteps,
  icon,
  title,
  description,
  value,
  onChangeText,
  onNext,
  onBack,
  placeholder = '0',
  canAdvance,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.progressRow}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </Pressable>
        )}
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < step ? styles.dotDone : i === step ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step + 1}/{totalSteps}
        </Text>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon as any} size={32} color={Colors.accent} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(600).delay(300)} style={styles.title}>
          {title}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.duration(600).delay(400)} style={styles.description}>
          {description}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.inputWrap}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9.]/g, '');
              onChangeText(cleaned);
            }}
            keyboardType="decimal-pad"
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            autoFocus
            selectionColor={Colors.accent}
          />
          <Text style={styles.perMonth}>/month</Text>
        </Animated.View>
      </View>

      {/* Next Button */}
      <Animated.View entering={FadeInUp.duration(500).delay(700)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canAdvance && styles.buttonDisabled,
            pressed && canAdvance && styles.buttonPressed,
          ]}
          onPress={canAdvance ? onNext : undefined}
        >
          <Text style={[styles.buttonText, !canAdvance && styles.buttonTextDisabled]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={canAdvance ? Colors.bg : Colors.textMuted}
          />
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  dotDone: {
    backgroundColor: Colors.accent,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    opacity: 0.7,
  },
  dotInactive: {
    backgroundColor: Colors.borderLight,
  },
  stepLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.accent,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    paddingVertical: Spacing.sm,
  },
  perMonth: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomWrap: {
    paddingBottom: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.bgCardLight,
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
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
});
