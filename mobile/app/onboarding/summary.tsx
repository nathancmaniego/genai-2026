import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import { useBudget } from '@/context/BudgetContext';
import { calculateDailyFunBudget } from '@/services/storage';
import { initializeBudget } from '@/services/api';

export default function SummaryScreen() {
  const router = useRouter();
  const { income, costs, savings } = useLocalSearchParams<{
    income: string;
    costs: string;
    savings: string;
  }>();
  const { setProfile } = useBudget();
  const [loading, setLoading] = useState(false);

  const incomeNum = parseFloat(income || '0');
  const costsNum = parseFloat(costs || '0');
  const savingsNum = parseFloat(savings || '0');
  const dailyBudget = calculateDailyFunBudget(incomeNum, costsNum, savingsNum);
  const monthlyFun = incomeNum - costsNum - savingsNum;

  const handleActivate = async () => {
    setLoading(true);
    const profile = {
      monthlyIncome: incomeNum,
      fixedCosts: costsNum,
      savingsGoal: savingsNum,
      dailyFunBudget: dailyBudget,
      currentBalance: dailyBudget,
    };

    await setProfile(profile);

    try {
      await initializeBudget(profile);
    } catch {
      // Backend might not be running yet
    }

    router.replace('/hud');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Line items */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.ledger}>
        <LedgerRow label="income" value={incomeNum} sign="+" />
        <View style={styles.rule} />
        <LedgerRow label="fixed costs" value={costsNum} sign="-" />
        <View style={styles.rule} />
        <LedgerRow label="savings" value={savingsNum} sign="-" />
        <View style={styles.ruleBold} />
        <LedgerRow label="monthly free" value={monthlyFun} sign="=" accent />
      </Animated.View>

      {/* Hero */}
      <Animated.View entering={FadeInUp.duration(600).delay(600)} style={styles.hero}>
        <Text style={styles.heroLabel}>DAILY BUDGET</Text>
        <Text style={styles.heroAmount}>${dailyBudget.toFixed(2)}</Text>
        <Text style={styles.heroFormula}>
          ({incomeNum.toLocaleString()} - {costsNum.toLocaleString()} - {savingsNum.toLocaleString()}) / 30
        </Text>
      </Animated.View>

      {/* Activate */}
      <Animated.View entering={FadeInUp.duration(400).delay(900)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleActivate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'initializing...' : 'activate c.h.u.d'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function LedgerRow({
  label,
  value,
  sign,
  accent = false,
}: {
  label: string;
  value: number;
  sign: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, accent && styles.rowLabelAccent]}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.rowValueAccent]}>
        {sign} ${Math.abs(value).toLocaleString()}
      </Text>
    </View>
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
  headerTitle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  ledger: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    ...superellipse(Radii.xl),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowLabelAccent: {
    color: Colors.white,
    fontWeight: '600',
  },
  rowValue: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  rowValueAccent: {
    color: Colors.accent,
    fontWeight: '700',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
  },
  ruleBold: {
    height: 1,
    backgroundColor: Colors.textMuted,
    marginVertical: 2,
  },
  hero: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    paddingVertical: Spacing.xl + 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...superellipse(Radii.xl),
  },
  heroLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 4,
  },
  heroAmount: {
    fontFamily: Fonts.mono,
    fontSize: 56,
    fontWeight: '800',
    color: Colors.white,
    marginTop: Spacing.sm,
    letterSpacing: -2,
  },
  heroFormula: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
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
