import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  currentBalance: number;
  dailyBudget: number;
  discretionaryBalance: number;
  discretionaryBudget: number;
}

function dotColor(ratio: number) {
  return ratio > 0.5 ? Colors.white : ratio > 0.2 ? Colors.textSecondary : Colors.red;
}

export default function BudgetTicker({ currentBalance, dailyBudget, discretionaryBalance, discretionaryBudget }: Props) {
  const ratio = dailyBudget > 0 ? currentBalance / dailyBudget : 0;
  const discRatio = discretionaryBudget > 0 ? discretionaryBalance / discretionaryBudget : 0;
  const showDisc = discretionaryBudget > 0;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.section}>
          <View style={[styles.dot, { backgroundColor: dotColor(ratio) }]} />
          <Text style={styles.label}>BAL</Text>
          <Text style={[styles.amount, ratio <= 0.2 && { color: Colors.red }]}>
            ${currentBalance.toFixed(2)}
          </Text>
          <Text style={styles.sep}>/</Text>
          <Text style={styles.total}>${dailyBudget.toFixed(2)}</Text>
        </View>

        {showDisc && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <View style={[styles.dot, { backgroundColor: dotColor(discRatio) }]} />
              <Text style={styles.label}>DISC</Text>
              <Text style={[styles.amount, discRatio <= 0.2 && { color: Colors.red }]}>
                ${discretionaryBalance.toFixed(2)}
              </Text>
              <Text style={styles.sep}>/</Text>
              <Text style={styles.total}>${discretionaryBudget.toFixed(2)}</Text>
            </View>
          </>
        )}
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
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...superellipse(Radii.md),
  },
  section: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginRight: 2,
  },
  amount: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  sep: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    marginHorizontal: 1,
  },
  total: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
