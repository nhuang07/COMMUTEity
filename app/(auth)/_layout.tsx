import { useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { getUserId } from "@/lib/storage";
import "../global.css";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    async function checkAuth() {
      const userId = await getUserId();
      const inAuthGroup = segments[0] === "(auth)";

      if (!userId && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (userId && inAuthGroup) {
        router.replace("/(tabs)/home");
      }
      setIsReady(true);
    }
    checkAuth();
  }, [segments]);

  if (!isReady) return null; // could swap for a splash/loading screen

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}