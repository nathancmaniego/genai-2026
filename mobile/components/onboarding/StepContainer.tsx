import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  onContinue: () => void;
  canContinue: boolean;
  buttonLabel?: string;
}

export default function StepContainer({
  children,
  onContinue,
  canContinue,
  buttonLabel = 'continue',
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.body}>{children}</View>

        <View style={styles.bottomWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !canContinue && styles.buttonDisabled,
              pressed && canContinue && styles.buttonPressed,
            ]}
            onPress={canContinue ? onContinue : undefined}
          >
            <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  body: {
    flex: 1,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  bottomWrap: {
    paddingTop: Spacing.lg,
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
