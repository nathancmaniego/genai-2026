import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BudgetProvider } from '@/context/BudgetContext';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <BudgetProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'fade',
        }}
      />
    </BudgetProvider>
  );
}
