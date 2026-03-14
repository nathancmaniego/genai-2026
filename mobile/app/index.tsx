import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/BudgetContext';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { profile, loading } = useBudget();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (profile) {
      router.replace('/hud');
    } else {
      router.replace('/onboarding');
    }
  }, [loading, profile, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
