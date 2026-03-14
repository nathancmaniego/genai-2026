import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  currentBalance: number;
  dailyBudget: number;
}

export default function BudgetTicker({ currentBalance, dailyBudget }: Props) {
  const ratio = dailyBudget > 0 ? currentBalance / dailyBudget : 0;
  const dot = ratio > 0.5 ? Colors.white : ratio > 0.2 ? Colors.textSecondary : Colors.red;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <View style={[styles.dot, { backgroundColor: dot }]} />
          <Text style={styles.label}>BAL</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, ratio <= 0.2 && { color: Colors.red }]}>
            ${currentBalance.toFixed(2)}
          </Text>
          <Text style={styles.sep}>/</Text>
          <Text style={styles.total}>${dailyBudget.toFixed(2)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...superellipse(Radii.md),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontFamily: Fonts.mono,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  sep: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
  total: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
