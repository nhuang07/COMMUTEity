import { ScrollView, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getGreeting } from "@/utils/greeting";
import { getProfile } from "@/lib/storage";
import { Card } from "@/components/Card";
import { theme } from "@/constants/theme";

export default function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const profile = getProfile();
  const displayName = profile?.displayName ?? "Commuter";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.greeting}>
          {greeting}, {displayName}
        </Text>

        <Text style={styles.sectionTitle}>Your Commute</Text>

        <Card variant="default">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Home area</Text>
            <Text style={styles.infoValue}>{profile?.homeArea || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Campus</Text>
            <Text style={styles.infoValue}>{profile?.destination || "UBC Vancouver"}</Text>
          </View>
        </Card>

        <Card variant="default">
          <Text style={styles.tipText}>
            Tap <Text style={styles.tipBold}>Track</Text> below to start your commute. After a
            few overlapping trips with another student, you'll see a match here.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  contentContainer: { padding: theme.spacing.lg, gap: theme.spacing.md },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  infoValue: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary },
  tipText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },
  tipBold: { fontWeight: theme.fontWeight.semibold, color: theme.colors.textPrimary },
});
