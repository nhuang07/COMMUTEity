import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import ngeohash from "ngeohash";
import { getGreeting } from "@/utils/greeting";
import { getProfile, getUserId, addNotifications } from "@/lib/storage";
import { startCommute, endCommute, type Checkpoint } from "@/lib/api";
import { LiveMap } from "@/components/LiveMap";
import { Button } from "@/components/Button";
import { formatElapsedTime } from "@/utils/timeFormat";
import { theme } from "@/constants/theme";

const SAMPLE_INTERVAL_MS = 60_000;

interface CommuteState {
  status: "idle" | "active" | "uploading";
  sessionId: string | null;
  startedAt: number | null;
  userId: string | null;
}

export default function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const profile = getProfile();
  const displayName = profile?.displayName ?? "Commuter";

  const [commute, setCommute] = useState<CommuteState>({
    status: "idle",
    sessionId: null,
    startedAt: null,
    userId: null,
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

      setCommute({ status: "active", sessionId, startedAt: Date.now(), userId });
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

    const { sessionId, userId } = commute;
    if (!sessionId || !userId) return;

    setCommute((prev) => ({ ...prev, status: "uploading" }));

    try {
      const notifications = await endCommute({
        userId,
        sessionId,
        checkpoints: checkpointsRef.current,
      });

      checkpointsRef.current = [];
      addNotifications(notifications);

      setCommute({ status: "idle", sessionId: null, startedAt: null, userId: null });
      setElapsed(0);

      if (notifications.length > 0) {
        Alert.alert(
          "Commute match found!",
          "You may share a commute with someone. Check the Matches tab."
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      Alert.alert("Upload failed", msg);
      setCommute({ status: "idle", sessionId: null, startedAt: null, userId: null });
      setElapsed(0);
    }
  }

  const isActive = commute.status === "active";
  const isUploading = commute.status === "uploading";

  return (
    <View style={styles.container}>
      <LiveMap
        tracking={isActive}
        topOverlay={
          <View style={styles.greetingPill}>
            <Text style={styles.greetingText} numberOfLines={1}>
              {greeting}, {displayName}
            </Text>
          </View>
        }
        bottomOverlay={
          <View style={styles.bottomStack}>
            <View style={styles.commuteCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commuteLabel}>Commute to</Text>
                <Text style={styles.commuteDestination} numberOfLines={1}>
                  {profile?.destination || "UBC Vancouver"}
                </Text>
              </View>
              {isActive && (
                <Text style={styles.elapsed}>{formatElapsedTime(elapsed)}</Text>
              )}
            </View>

            {isUploading && <Text style={styles.uploading}>Uploading your route…</Text>}

            {commute.status === "idle" ? (
              <Button label="Start Commute" onPress={handleStart} variant="primary" size="large" />
            ) : (
              <Button
                label={isUploading ? "Uploading…" : "End Commute"}
                onPress={handleEnd}
                variant="destructive"
                size="large"
                disabled={isUploading}
              />
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  greetingPill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.background + "E6",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    marginTop: theme.spacing.sm,
    maxWidth: "70%",
  },
  greetingText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.textPrimary,
  },
  bottomStack: {
    gap: theme.spacing.sm,
  },
  commuteCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: theme.colors.surface + "F2",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.sm,
  },
  commuteLabel: {
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  commuteDestination: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamilyDisplay.semibold,
    color: theme.colors.textPrimary,
  },
  elapsed: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.recording,
    fontVariant: ["tabular-nums"],
  },
  uploading: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.normal,
    color: theme.colors.textSecondary,
  },
});
