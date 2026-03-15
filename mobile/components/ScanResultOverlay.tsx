import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

const AUTO_DISMISS_MS = 12000;

interface Props {
  text: string;
  onDismiss: () => void;
}

function formatScanText(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/^Here's the analysis:\s*\n?/i, '')
    .trim();
}

export default function ScanResultOverlay({ text, onDismiss }: Props) {
  const formatted = formatScanText(text);

  useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.wrapper}
      pointerEvents="box-none"
    >
      <Animated.View
        entering={SlideInRight.duration(300).springify()}
        style={styles.card}
      >
        <Pressable style={styles.cardPress} onPress={onDismiss}>
          <View style={styles.header}>
            <View style={styles.dot} />
            <Text style={styles.label}>SCAN</Text>
          </View>

          <Text style={styles.body}>{formatted}</Text>

          <Text style={styles.tapHint}>tap to dismiss · auto-closes in 12s</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Spacing.xl + 40,
    right: Spacing.lg,
    left: Spacing.xl,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  card: {
    maxWidth: 380,
    ...superellipse(Radii.lg),
    overflow: 'hidden',
  },
  cardPress: {
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(92, 224, 210, 0.25)',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    ...superellipse(Radii.lg),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});
