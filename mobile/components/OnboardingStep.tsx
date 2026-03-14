import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface Props {
  step: number;
  totalSteps: number;
  label: string;
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
  label,
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      {/* Header — stays fixed */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'\u2190'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.stepLabel}>
          {String(step + 1).padStart(2, '0')}/{String(totalSteps).padStart(2, '0')}
        </Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </Animated.View>

      {/* Scrollable content — shrinks when keyboard appears */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <Animated.Text entering={FadeInDown.duration(500).delay(150)} style={styles.label}>
            {label}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(500).delay(250)} style={styles.title}>
            {title}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(500).delay(350)} style={styles.description}>
            {description}
          </Animated.Text>

          <Animated.View entering={FadeInUp.duration(500).delay(450)} style={styles.inputWrap}>
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
              keyboardAppearance="dark"
            />
            <Text style={styles.perMonth}>/mo</Text>
          </Animated.View>
        </View>

        {/* Button inside scroll so it's always reachable */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.bottomWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !canAdvance && styles.buttonDisabled,
              pressed && canAdvance && styles.buttonPressed,
            ]}
            onPress={canAdvance ? onNext : undefined}
          >
            <Text style={[styles.buttonText, !canAdvance && styles.buttonTextDisabled]}>
              continue
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
    ...superellipse(Radii.sm),
  },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  stepLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  progressTrack: {
    height: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    ...superellipse(Radii.lg),
  },
  dollarSign: {
    fontFamily: Fonts.mono,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    paddingVertical: Spacing.sm,
  },
  perMonth: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textMuted,
  },
  bottomWrap: {
    paddingBottom: Spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 18,
    ...superellipse(Radii.lg),
  },
  buttonDisabled: {
    backgroundColor: Colors.bgElevated,
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
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
});
