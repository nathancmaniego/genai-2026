import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';
import { useBudget } from '@/context/BudgetContext';
import { calculateDailyFunBudget, getApiUrl, getUserProfile } from '@/services/storage';
import { setApiBaseUrl } from '@/services/api';
import type { UserProfile } from '@/types/profile';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, setProfile, resetBalance, clearProfile } = useBudget();

  const [editing, setEditing] = useState(false);
  const [income, setIncome] = useState('');
  const [costs, setCosts] = useState('');
  const [savings, setSavings] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (profile) {
      setIncome(String(profile.monthlyIncome));
      setCosts(String(profile.fixedCosts));
      setSavings(String(profile.savingsGoal));
    }
    getApiUrl().then((url) => {
      if (url) setApiBaseUrl(url);
    });
    getUserProfile().then(setUserProfile);
  }, [profile]);

  const handleSaveProfile = async () => {
    const inc = parseFloat(income) || 0;
    const cos = parseFloat(costs) || 0;
    const sav = parseFloat(savings) || 0;
    const daily = calculateDailyFunBudget(inc, cos, sav);

    await setProfile({
      monthlyIncome: inc,
      fixedCosts: cos,
      savingsGoal: sav,
      dailyFunBudget: daily,
      currentBalance: daily,
    });
    setEditing(false);
  };

  const handleResetBalance = () => {
    Alert.alert(
      'reset balance',
      `Reset to daily budget of $${profile?.dailyFunBudget.toFixed(2)}?`,
      [
        { text: 'cancel', style: 'cancel' },
        { text: 'reset', style: 'destructive', onPress: resetBalance },
      ]
    );
  };

  const handleRecalibrate = () => {
    Alert.alert(
      'recalibrate',
      'Clear profile and restart onboarding?',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'recalibrate',
          style: 'destructive',
          onPress: async () => {
            await clearProfile();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  if (!profile) return null;

  const dailyBudget = calculateDailyFunBudget(
    parseFloat(income) || 0,
    parseFloat(costs) || 0,
    parseFloat(savings) || 0
  );

  return (
    <View style={[styles.container, { paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>profile</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
          <Text style={styles.balanceAmount}>${profile.currentBalance.toFixed(2)}</Text>
          <Text style={styles.balanceSub}>
            of ${profile.dailyFunBudget.toFixed(2)} daily budget
          </Text>
          <Pressable style={styles.resetBalanceBtn} onPress={handleResetBalance}>
            <Text style={styles.resetBalanceText}>reset balance</Text>
          </Pressable>
        </Animated.View>

        {/* Budget Breakdown */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>budget</Text>
            {!editing && (
              <Pressable onPress={() => setEditing(true)}>
                <Text style={styles.editBtn}>edit</Text>
              </Pressable>
            )}
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <EditRow label="income" value={income} onChangeText={setIncome} />
              <View style={styles.rule} />
              <EditRow label="fixed costs" value={costs} onChangeText={setCosts} />
              <View style={styles.rule} />
              <EditRow label="savings" value={savings} onChangeText={setSavings} />
              <View style={styles.ruleBold} />
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>new daily budget</Text>
                <Text style={styles.previewValue}>${dailyBudget.toFixed(2)}</Text>
              </View>

              <View style={styles.editActions}>
                <Pressable
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => {
                    setEditing(false);
                    setIncome(String(profile.monthlyIncome));
                    setCosts(String(profile.fixedCosts));
                    setSavings(String(profile.savingsGoal));
                  }}
                >
                  <Text style={styles.cancelText}>cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveText}>save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.ledger}>
              <LedgerRow label="income" value={profile.monthlyIncome} sign="+" />
              <View style={styles.rule} />
              <LedgerRow label="fixed costs" value={profile.fixedCosts} sign="-" />
              <View style={styles.rule} />
              <LedgerRow label="savings" value={profile.savingsGoal} sign="-" />
              <View style={styles.ruleBold} />
              <LedgerRow
                label="daily budget"
                value={profile.dailyFunBudget}
                sign="="
                accent
              />
            </View>
          )}
        </Animated.View>

        {/* Server Config — hidden; auto-detected from Expo dev server IP */}

        {/* Preferences */}
        {userProfile && (
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>preferences</Text>
            <View style={styles.ledger}>
              <PrefRow label="saving for" value={userProfile.primarySavingsGoal} />
              <View style={styles.rule} />
              <PrefRow label="tone" value={userProfile.chudTone} />
              <View style={styles.rule} />
              <PrefRow label="intervene" value={userProfile.interventionPreference} />
              <View style={styles.rule} />
              <PrefRow label="warning" value={userProfile.preferredWarningType} />
              {userProfile.overspendingTriggers.length > 0 && (
                <>
                  <View style={styles.rule} />
                  <PrefRow label="triggers" value={userProfile.overspendingTriggers.join(', ')} />
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.section}>
          <Pressable style={styles.dangerBtn} onPress={handleRecalibrate}>
            <Text style={styles.dangerText}>recalibrate profile</Text>
          </Pressable>
          <Text style={styles.dangerHint}>
            clears all data and restarts onboarding
          </Text>
        </Animated.View>
      </ScrollView>
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
      <Text style={[styles.rowLabel, accent && styles.rowAccentLabel]}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.rowAccentValue]}>
        {sign} ${Math.abs(value).toLocaleString()}
      </Text>
    </View>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { maxWidth: '60%', textAlign: 'right' }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function EditRow({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.editRow}>
      <Text style={styles.editLabel}>{label}</Text>
      <View style={styles.editInputWrap}>
        <Text style={styles.editDollar}>$</Text>
        <TextInput
          style={styles.editInput}
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          selectionColor={Colors.accent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 80,
    gap: Spacing.lg,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...superellipse(Radii.xl),
  },
  balanceLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  balanceAmount: {
    fontFamily: Fonts.mono,
    fontSize: 44,
    fontWeight: '800',
    color: Colors.white,
    marginTop: Spacing.xs,
    letterSpacing: -1.5,
  },
  balanceSub: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  resetBalanceBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bgElevated,
    ...superellipse(Radii.sm),
  },
  resetBalanceText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  // Section
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  editBtn: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 1,
  },

  // Ledger
  ledger: {
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
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rowAccentLabel: {
    color: Colors.white,
    fontWeight: '600',
  },
  rowValue: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  rowAccentValue: {
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

  // Edit Form
  editForm: {
    backgroundColor: Colors.bgCard,
    padding: Spacing.lg,
    ...superellipse(Radii.xl),
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  editLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...superellipse(Radii.sm),
  },
  editDollar: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.textMuted,
    marginRight: 2,
  },
  editInput: {
    fontFamily: Fonts.mono,
    fontSize: 15,
    color: Colors.white,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
    paddingVertical: 2,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  previewValue: {
    fontFamily: Fonts.mono,
    fontSize: 17,
    color: Colors.accent,
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    ...superellipse(Radii.md),
  },
  cancelBtn: {
    backgroundColor: Colors.bgElevated,
  },
  cancelText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  saveBtn: {
    backgroundColor: Colors.white,
  },
  saveText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.bg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Danger Zone
  dangerBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...superellipse(Radii.md),
  },
  dangerText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.red,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dangerHint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
