import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, Region, MapStyleElement, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { darkMapStyle } from "@/constants/mapStyle";

const DEFAULT_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

type Status = "requesting" | "denied" | "locating" | "ready" | "unsupported";

export interface LiveMapProps {
  /** When true, live position updates are accumulated into a drawn route line. */
  tracking?: boolean;
  topOverlay?: React.ReactNode;
  bottomOverlay?: React.ReactNode;
}

export function LiveMap({ tracking = false, topOverlay, bottomOverlay }: LiveMapProps) {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<Status>(
    Platform.OS === "web" ? "unsupported" : "requesting"
  );
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const mapRef = useRef<MapView>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const wasTrackingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;

    async function start() {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      setStatus("locating");
      try {
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setCoords({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 10 },
        (update) => {
          if (cancelled) return;
          const next = { latitude: update.coords.latitude, longitude: update.coords.longitude };
          setCoords(next);
        }
      );
    }

    start();
    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
    };
  }, []);

  // Accumulate the route line while tracking; start a fresh line each time tracking begins.
  useEffect(() => {
    if (!coords) return;
    if (tracking && !wasTrackingRef.current) {
      setRouteCoords([coords]);
    } else if (tracking) {
      setRouteCoords((prev) => (prev.length ? [...prev, coords] : [coords]));
    }
    wasTrackingRef.current = tracking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, tracking]);

  function recenter() {
    if (!coords || !mapRef.current) return;
    mapRef.current.animateToRegion({ ...coords, ...DEFAULT_DELTA }, 400);
  }

  if (status === "unsupported") {
    return (
      <View style={[styles.fill, styles.centerContent]}>
        <Ionicons name="map-outline" size={28} color={theme.colors.textMuted} />
        <Text style={styles.fallbackText}>Live map is available on the iOS and Android app</Text>
      </View>
    );
  }

  if (status === "denied") {
    return (
      <View style={[styles.fill, styles.centerContent]}>
        <Ionicons name="location-outline" size={28} color={theme.colors.textMuted} />
        <Text style={styles.fallbackText}>
          Enable location access to see yourself on the map
        </Text>
      </View>
    );
  }

  if (status === "requesting" || status === "locating" || !coords) {
    return (
      <View style={[styles.fill, styles.centerContent]}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={styles.fallbackText}>Finding your location…</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coords, ...DEFAULT_DELTA } as Region}
        customMapStyle={Platform.OS === "android" ? (darkMapStyle as unknown as MapStyleElement[]) : undefined}
        userInterfaceStyle={Platform.OS === "ios" ? "dark" : undefined}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        <Marker coordinate={coords} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={[styles.markerRing, tracking && styles.markerRingTracking]}>
            <View style={styles.markerDot} />
          </View>
        </Marker>
      </MapView>

      <View pointerEvents="box-none" style={[styles.overlayFill, { paddingTop: insets.top + theme.spacing.sm }]}>
        <View pointerEvents="box-none" style={styles.topRow}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, tracking && styles.statusDotRecording]} />
            <Text style={styles.statusBadgeText}>{tracking ? "RECORDING" : "LIVE"}</Text>
          </View>

          <Pressable
            onPress={recenter}
            style={styles.recenterButton}
            accessibilityRole="button"
            accessibilityLabel="Recenter map on your location"
          >
            <Ionicons name="navigate" size={16} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        {topOverlay}
        <View style={{ flex: 1 }} />
        {bottomOverlay}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  fallbackText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.normal,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  markerRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  markerRingTracking: {
    backgroundColor: theme.colors.recording + "33",
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.primaryForeground,
  },
  overlayFill: {
    ...StyleSheet.absoluteFillObject,
    padding: theme.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.background + "E6",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
  },
  statusDotRecording: {
    backgroundColor: theme.colors.recording,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.textPrimary,
    letterSpacing: 0.6,
  },
  recenterButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background + "E6",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
