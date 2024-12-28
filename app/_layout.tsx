import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
