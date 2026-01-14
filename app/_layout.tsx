import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

export default function RootLayout() {
  
  useEffect(() => {
    async function configureNavigationBar() {
      if (Platform.OS === 'android') {

        //await NavigationBar.setPositionAsync('relative');

        //await NavigationBar.setBackgroundColorAsync('#f5f5f5'); 

        await NavigationBar.setButtonStyleAsync('dark');
      }
    }

    configureNavigationBar();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="item/[id]" />
    </Stack>
  );
}