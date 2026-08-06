import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import ngeohash from "ngeohash";
import { theme } from "@/constants/theme";
import { getProfile, getUserId, addNotifications } from "@/lib/storage";
import { startCommute, endCommute, type Checkpoint } from "@/lib/api";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { formatElapsedTime } from "@/utils/timeFormat";

const SAMPLE_INTERVAL_MS = 60_000;

interface CommuteState {
  status: "idle" | "active" | "uploading";
  sessionId: string | null;
  startedAt: number | null;
}

export default function TrackScreen() {
  const profile = getProfile();
  const [commute, setCommute] = useState<CommuteState>({
    status: "idle",
    sessionId: null,
    startedAt: null,
  });
  const [elapsed, setElapsed] = useState(0);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (commute.status === "active" && commute.startedAt !== null) {
      const timer = setInterval(() => {
        setElapsed(Math.floor((Date.now() - commute.startedAt!) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [commute.status, commute.startedAt]);

  async function handleStart() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Location required", "Enable location access to track your commute.");
      return;
    }

    try {
      const userId = await getUserId();
      if (!userId) { Alert.alert("Not signed in"); return; }

      const sessionId = await startCommute(userId);
      checkpointsRef.current = [];

      // Sample location immediately, then every 60s
      const sampleLocation = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const gh = ngeohash.encode(loc.coords.latitude, loc.coords.longitude, 7);
          checkpointsRef.current.push({
            geohash: gh,
            timestamp: new Date().toISOString(),
          });
        } catch {
          // Silently skip missed samples
        }
      };

      await sampleLocation();
      intervalRef.current = setInterval(sampleLocation, SAMPLE_INTERVAL_MS);

      setCommute({ status: "active", sessionId, startedAt: Date.now() });
      setElapsed(0);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not start commute.");
    }
  }

  async function handleEnd() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const { sessionId } = commute;
    if (!sessionId) return;

    setCommute((prev) => ({ ...prev, status: "uploading" }));

    try {
      const userId = await getUserId();
      if (!userId) throw new Error("Not signed in");

      const notifications = await endCommute({
        userId,
        sessionId,
        checkpoints: checkpointsRef.current,
      });

      checkpointsRef.current = [];
      addNotifications(notifications);

      setCommute({ status: "idle", sessionId: null, startedAt: null });
      setElapsed(0);

      if (notifications.length > 0) {
        Alert.alert(
          "Commute match found!",
          "You may share a commute with someone. Check the Matches tab."
        );
      }
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload commute.");
      setCommute({ status: "idle", sessionId: null, startedAt: null });
      setElapsed(0);
    }
  }

  const isUploading = commute.status === "uploading";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Track Commute</Text>

        <Card title="Commute" subtitle={profile?.destination ?? "UBC Vancouver"}>
          {commute.status === "active" && (
            <Text style={styles.elapsed}>{formatElapsedTime(elapsed)}</Text>
          )}
          {isUploading && (
            <Text style={styles.uploading}>Uploading your route…</Text>
          )}
        </Card>

        <View style={styles.buttonContainer}>
          {commute.status === "idle" ? (
            <Button label="Start Commute" onPress={handleStart} variant="primary" size="large" />
          ) : (
            <Button
              label={isUploading ? "Uploading…" : "End Commute"}
              onPress={handleEnd}
              variant="destructive"
              size="large"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, padding: theme.spacing.xl },
  heading: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
  },
  elapsed: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryActive,
    marginTop: theme.spacing.md,
  },
  uploading: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  buttonContainer: { marginTop: theme.spacing.xl },
});
