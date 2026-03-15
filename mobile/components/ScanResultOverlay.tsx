import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

const AUTO_DISMISS_MS = 12000;

interface Props {
  text: string;
  price: number | null;
  onConfirm: (price: number) => void;
  onDismiss: () => void;
}

function formatScanText(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/^Here's the analysis:\s*\n?/i, '')
    .trim();
}

export default function ScanResultOverlay({ text, price, onConfirm, onDismiss }: Props) {
  const formatted = formatScanText(text);
  const hasPrice = price != null;

  useEffect(() => {
    if (hasPrice) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss, hasPrice]);

  const cardContent = (
    <>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.label}>SCAN</Text>
      </View>

      <Text style={styles.body}>{formatted}</Text>

      {hasPrice ? (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.confirmBtn, pressed && styles.confirmBtnPressed]}
            onPress={() => onConfirm(price)}
          >
            <Text style={styles.confirmText}>confirm · ${price.toFixed(2)}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.declineBtn, pressed && styles.declineBtnPressed]}
            onPress={onDismiss}
          >
            <Text style={styles.declineText}>decline</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.tapHint}>tap to dismiss · auto-closes in 12s</Text>
      )}
    </>
  );

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
        {hasPrice ? (
          <View style={styles.cardInner}>{cardContent}</View>
        ) : (
          <Pressable style={styles.cardInner} onPress={onDismiss}>
            {cardContent}
          </Pressable>
        )}
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
  cardInner: {
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    ...superellipse(Radii.sm),
  },
  confirmBtn: {
    backgroundColor: 'rgba(92, 224, 210, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(92, 224, 210, 0.4)',
  },
  confirmBtnPressed: {
    backgroundColor: 'rgba(92, 224, 210, 0.3)',
  },
  confirmText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1,
  },
  declineBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  declineBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  declineText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
