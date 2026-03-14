import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  currentBalance: number;
  dailyBudget: number;
}

export default function BudgetTicker({ currentBalance, dailyBudget }: Props) {
  const ratio = dailyBudget > 0 ? currentBalance / dailyBudget : 0;
  const color = ratio > 0.5 ? Colors.green : ratio > 0.2 ? Colors.yellow : Colors.red;

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <View style={[styles.indicator, { backgroundColor: color }]} />
          <Text style={styles.label}>BALANCE</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color }]}>${currentBalance.toFixed(2)}</Text>
          <Text style={styles.divider}>/</Text>
          <Text style={styles.budget}>${dailyBudget.toFixed(2)}</Text>
          <Ionicons name="wallet" size={14} color={Colors.textMuted} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backdropFilter: 'blur(10px)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
  },
  divider: {
    fontSize: 16,
    color: Colors.textMuted,
    marginHorizontal: 3,
  },
  budget: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
