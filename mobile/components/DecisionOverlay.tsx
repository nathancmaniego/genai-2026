import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import type { AnalyzeResponse } from '@/services/api';

interface Props {
  result: AnalyzeResponse;
  onDismiss: () => void;
}

export default function DecisionOverlay({ result, onDismiss }: Props) {
  const isAffordable = result.canAfford;
  const accentColor = isAffordable ? Colors.accent : Colors.red;

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
      <Pressable style={styles.dismissArea} onPress={onDismiss} />
      <Animated.View entering={SlideInDown.duration(350).springify()} style={styles.card}>
        {/* Verdict */}
        <View style={styles.verdictRow}>
          <View style={[styles.verdictDot, { backgroundColor: accentColor }]} />
          <Text style={[styles.verdict, { color: accentColor }]}>
            {isAffordable ? 'AFFORDABLE' : 'OVER BUDGET'}
          </Text>
        </View>

        {/* Item + Price */}
        <Text style={styles.itemName}>{result.item}</Text>
        <Text style={[styles.price, { color: accentColor }]}>
          ${result.estimatedPrice.toFixed(2)}
        </Text>

        {/* Voice Line */}
        <View style={styles.quoteWrap}>
          <Text style={styles.quoteText}>"{result.voiceLine}"</Text>
        </View>

        {/* Remainder */}
        <View style={styles.remainderRow}>
          <Text style={styles.remainderLabel}>after purchase</Text>
          <Text style={[styles.remainderValue, { color: result.fundsRemaining >= 0 ? Colors.white : Colors.red }]}>
            ${result.fundsRemaining.toFixed(2)}
          </Text>
        </View>

        {/* Dismiss */}
        <Pressable
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
          onPress={onDismiss}
        >
          <Text style={styles.dismissText}>dismiss</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    paddingBottom: 50,
    gap: Spacing.md,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verdictDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verdict: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  itemName: {
    fontFamily: Fonts.mono,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  price: {
    fontFamily: Fonts.mono,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  quoteWrap: {
    backgroundColor: Colors.bgElevated,
    padding: Spacing.md,
    ...superellipse(Radii.md),
  },
  quoteText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  remainderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  remainderLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  remainderValue: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.bgElevated,
    ...superellipse(Radii.md),
  },
  dismissText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
