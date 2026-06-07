import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="send/index" options={{ title: 'Send Money', headerShown: false }} />
        <Stack.Screen name="send/amount" options={{ title: 'Enter Amount', headerShown: false }} />
        <Stack.Screen name="send/send-money-confirm" options={{ title: 'Confirm Payment', headerShown: false }} />
        <Stack.Screen name="send/auth" options={{ title: 'Authentication', headerShown: false }} />
        <Stack.Screen name="send/success" options={{ title: 'Success', headerShown: false }} />
        <Stack.Screen name="recharge/index" options={{ title: 'Mobile Recharge', headerShown: false }} />
        <Stack.Screen name="recharge/amount" options={{ title: 'Enter Amount', headerShown: false }} />
        <Stack.Screen name="recharge/confirm" options={{ title: 'Confirm Recharge', headerShown: false }} />
        <Stack.Screen name="recharge/success" options={{ title: 'Success', headerShown: false }} />
        <Stack.Screen name="payment/index" options={{ title: 'Merchant Payment', headerShown: false }} />
        <Stack.Screen name="payment/amount" options={{ title: 'Enter Amount', headerShown: false }} />
        <Stack.Screen name="payment/confirm" options={{ title: 'Confirm Payment', headerShown: false }} />
        <Stack.Screen name="payment/success" options={{ title: 'Success', headerShown: false }} />
        <Stack.Screen name="bill" options={{ title: 'Pay Bill' }} />
        <Stack.Screen name="tickets" options={{ title: 'Buy Tickets' }} />
        <Stack.Screen name="cash-out/index" options={{ title: 'Cash Out', headerShown: false }} />
        <Stack.Screen name="cash-out/amount" options={{ title: 'Enter Amount', headerShown: false }} />
        <Stack.Screen name="cash-out/confirm" options={{ title: 'Confirm Cash Out', headerShown: false }} />
        <Stack.Screen name="cash-out/token" options={{ title: 'Cash Out Code', headerShown: false }} />
        <Stack.Screen name="bank-transfer" options={{ title: 'Bank Transfer' }} />
        <Stack.Screen name="my-cards" options={{ title: 'My Cards' }} />
        <Stack.Screen name="savings" options={{ title: 'Savings' }} />
        <Stack.Screen name="transactions" options={{ title: 'Transactions' }} />
        <Stack.Screen name="services" options={{ title: 'Services' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="register/index" options={{ title: 'Register', headerShown: false }} />
        <Stack.Screen name="scan/index" options={{ title: 'Scan QR', headerShown: false }} />
        <Stack.Screen name="scan/result" options={{ title: 'Scan Result', headerShown: false }} />
        <Stack.Screen name="scan/confirm" options={{ title: 'Confirm Payment', headerShown: false }} />
        <Stack.Screen name="scan/success" options={{ title: 'Success', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
