import { useEffect, useRef, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { getUserId } from "@/lib/storage";
import "../global.css";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const hasNavigated = useRef(false);
  const segments = useSegments();

  useEffect(() => {
    async function checkAuth() {
      if (hasNavigated.current) return;

      const userId = await getUserId();
      const inAuthGroup = segments[0] === "(auth)";

      if (!userId && !inAuthGroup) {
        hasNavigated.current = true;
        router.replace("/(auth)/login");
      } else if (userId && inAuthGroup) {
        hasNavigated.current = true;
        router.replace("/(tabs)/");
      }
      setIsReady(true);
    }
    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
