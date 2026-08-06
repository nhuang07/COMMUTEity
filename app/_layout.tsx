import { useEffect, useRef, useState, useCallback } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts as usePlusJakartaSans, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts as useSpaceGrotesk, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { getUserId, getProfile } from "@/lib/storage";
import { theme } from "@/constants/theme";
import "../global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const hasNavigated = useRef(false);
  const segments = useSegments();

  const [jakartaLoaded] = usePlusJakartaSans({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [groteskLoaded] = useSpaceGrotesk({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });
  const fontsLoaded = jakartaLoaded && groteskLoaded;

  useEffect(() => {
    async function checkAuth() {
      if (hasNavigated.current) return;

      const userId = await getUserId();
      const profile = getProfile();
      const inAuthGroup = segments[0] === "(auth)";
      const hasCompletedOnboarding = profile && profile.homeArea && profile.destination;

      if (!userId && !inAuthGroup) {
        // Not signed in — send to login
        hasNavigated.current = true;
        router.replace("/(auth)/login");
      } else if (userId && hasCompletedOnboarding && inAuthGroup) {
        // Signed in + profile complete — go to main app
        hasNavigated.current = true;
        router.replace("/(tabs)/");
      }
      // If userId exists but no profile yet, stay in auth group (onboarding)
      setIsReady(true);
    }
    checkAuth();
  }, [segments]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [isReady, fontsLoaded]);

  if (!isReady || !fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      </Stack>
    </View>
  );
}
