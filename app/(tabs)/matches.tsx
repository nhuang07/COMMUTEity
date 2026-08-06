import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { theme } from "@/constants/theme";
import { getNotifications, getUserId, updateNotificationStatus, type MatchNotification } from "@/lib/storage";
import { optIn } from "@/lib/api";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";

export default function MatchesScreen() {
  const [notifications, setNotifications] = useState<MatchNotification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Refresh from in-memory store whenever this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      const stored = getNotifications();
      // Add a demo match if there are no real notifications yet
      const demoMatch: MatchNotification = {
        pairId: "demo-pair-001",
        otherUserId: "demo-user-sarah",
        text: "You and Sarah both took the 99 B-Line from Metrotown to UBC around 8:15am on 3 consecutive days this week. You likely board at the same stop!",
        status: "pending",
      };
      if (stored.length === 0) {
        setNotifications([demoMatch]);
      } else {
        setNotifications(stored);
      }
    }, [])
  );

  const pending = notifications.filter((n) => n.status === "pending");
  const accepted = notifications.filter((n) => n.status === "accepted");
  const connected = notifications.filter((n) => n.status === "connected");

  async function handleOptIn(pairId: string, accepted: boolean) {
    setLoadingId(pairId);
    try {
      const userId = await getUserId();
      if (!userId) return;
      const isMutual = await optIn({ userId, pairId, optedIn: accepted });
      if (!accepted) {
        updateNotificationStatus(pairId, "rejected");
      } else if (isMutual) {
        updateNotificationStatus(pairId, "connected");
      } else {
        updateNotificationStatus(pairId, "accepted");
      }
      setNotifications(getNotifications());
      setExpandedId(null);
    } catch (e) {
      // silently ignore — UI stays consistent
    } finally {
      setLoadingId(null);
    }
  }

  if (notifications.filter((n) => n.status !== "rejected").length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.heading}>Matches</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Matches will appear after at least 2 tracked commutes with overlapping routes
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.heading}>Matches</Text>
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>
            {pending.map((n) => (
              <Pressable
                key={n.pairId}
                onPress={() =>
                  setExpandedId((prev) => (prev === n.pairId ? null : n.pairId))
                }
              >
                <Card variant="default">
                  <View style={styles.cardHeader}>
                    <Badge label="Pending" variant="default" />
                  </View>
                  <Text style={styles.explanation}>{n.text}</Text>

                  {expandedId === n.pairId && (
                    <View style={styles.actionsRow}>
                      <Button
                        label="Accept"
                        variant="primary"
                        loading={loadingId === n.pairId}
                        onPress={() => handleOptIn(n.pairId, true)}
                      />
                      <Button
                        label="Not Interested"
                        variant="secondary"
                        disabled={loadingId === n.pairId}
                        onPress={() => handleOptIn(n.pairId, false)}
                      />
                    </View>
                  )}
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {accepted.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waiting</Text>
            {accepted.map((n) => (
              <Card key={n.pairId} variant="default">
                <View style={styles.cardHeader}>
                  <Badge label="Pending" variant="default" />
                </View>
                <Text style={styles.explanation}>{n.text}</Text>
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>Waiting for the other person</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {connected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connections</Text>
            {connected.map((n) => (
              <Card key={n.pairId} variant="default">
                <View style={styles.cardHeader}>
                  <Badge label="Connected" variant="success" />
                </View>
                <Text style={styles.explanation}>{n.text}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  contentContainer: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  heading: {
    fontSize: theme.fontSize.xxl,
    fontFamily: theme.fontFamilyDisplay.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSize.md, fontFamily: theme.fontFamily.normal, color: theme.colors.textSecondary, textAlign: "center" },
  section: { marginBottom: theme.spacing.xl, gap: theme.spacing.md },
  sectionTitle: { fontSize: 12, fontFamily: theme.fontFamily.bold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, textTransform: "uppercase", letterSpacing: 0.8 },
  cardHeader: { marginBottom: theme.spacing.sm },
  explanation: { fontSize: theme.fontSize.sm, fontFamily: theme.fontFamily.normal, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, lineHeight: 20 },
  actionsRow: { flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.lg },
  waitingContainer: { marginTop: theme.spacing.lg, padding: theme.spacing.sm, backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.sm, alignItems: "center" },
  waitingText: { fontSize: theme.fontSize.sm, fontFamily: theme.fontFamily.medium, color: theme.colors.textSecondary },
});
