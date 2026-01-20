import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  
  useEffect(() => {
    async function configureNavigationBar() {
      if (Platform.OS === 'android') {
        await NavigationBar.setButtonStyleAsync('dark');
      }
    }

    configureNavigationBar();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
}