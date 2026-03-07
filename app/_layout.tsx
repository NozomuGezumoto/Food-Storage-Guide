import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { usePurchasesStore } from '@/store/usePurchasesStore';
import { useColorScheme } from '@/components/useColorScheme';
import { t } from '@/utils/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const isWeb = typeof document !== 'undefined';

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    usePurchasesStore.getState().load();
  }, []);

  useEffect(() => {
    if (loaded || isWeb) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isWeb]);

  if (!loaded && !isWeb) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerTitle: t('settings.title'),
          }}
        />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
