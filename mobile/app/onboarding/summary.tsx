import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
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

  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

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
      // Backend might not be running yet — that's ok for onboarding
    }

    router.replace('/hud');
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Financial Profile</Text>
        <View style={{ width: 32 }} />
      </Animated.View>

      {/* Breakdown Cards */}
      <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.cardsWrap}>
        <StatCard icon="wallet" label="Monthly Income" value={incomeNum} color={Colors.green} />
        <StatCard icon="home" label="Fixed Costs" value={costsNum} color={Colors.red} prefix="-" />
        <StatCard
          icon="shield"
          label="Savings Goal"
          value={savingsNum}
          color={Colors.yellow}
          prefix="-"
        />
        <View style={styles.divider} />
        <StatCard
          icon="cash"
          label="Monthly Fun Money"
          value={monthlyFun}
          color={Colors.accent}
        />
      </Animated.View>

      {/* Daily Budget Hero */}
      <Animated.View entering={FadeInUp.duration(800).delay(700)} style={styles.heroWrap}>
        <Animated.View style={[styles.heroGlow, glowStyle]} />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Daily Fun Budget</Text>
          <Text style={styles.heroAmount}>${dailyBudget.toFixed(2)}</Text>
          <Text style={styles.heroSub}>per day to spend freely</Text>
        </View>
        <View style={styles.formulaWrap}>
          <Text style={styles.formula}>
            (${incomeNum.toLocaleString()} − ${costsNum.toLocaleString()} − $
            {savingsNum.toLocaleString()}) ÷ 30
          </Text>
        </View>
      </Animated.View>

      {/* Activate */}
      <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={styles.bottomWrap}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleActivate}
          disabled={loading}
        >
          <Ionicons name="power" size={20} color={Colors.bg} />
          <Text style={styles.buttonText}>
            {loading ? 'Initializing...' : 'Activate JARVIS'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  prefix = '',
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  prefix?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>
        {prefix}${Math.abs(value).toLocaleString()}
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
    paddingTop: 60,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardsWrap: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  heroWrap: {
    marginTop: Spacing.lg,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accentGlow,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  heroLabel: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.white,
    marginTop: Spacing.xs,
    letterSpacing: -1,
  },
  heroSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  formulaWrap: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    zIndex: 1,
  },
  formula: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
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
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.bg,
  },
});
