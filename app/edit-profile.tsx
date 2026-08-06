import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { getProfile, setProfile, getUserId, getUserEmail } from "@/lib/storage";
import { createProfile } from "@/lib/api";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";

const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "5th+ year", "Grad student"];
const CAMPUSES = ["UBC Vancouver", "UBC Okanagan"];

export default function EditProfile() {
  const profile = getProfile();

  const [name, setName] = useState(profile?.displayName ?? "");
  const [homeArea, setHomeArea] = useState(profile?.homeArea ?? "");
  const [campus, setCampus] = useState<string | null>(profile?.destination ?? null);
  const [major, setMajor] = useState(profile?.faculty ?? "");
  const [year, setYear] = useState<string | null>(profile?.year ?? null);
  const [instagram, setInstagram] = useState(profile?.socials?.instagram ?? "");
  const [linkedin, setLinkedin] = useState(profile?.socials?.linkedin ?? "");
  const [discord, setDiscord] = useState(profile?.socials?.discord ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!homeArea.trim()) {
      setError("Home area is required.");
      return;
    }
    if (!campus) {
      setError("Select your campus.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const userId = await getUserId();
      const email = getUserEmail();
      if (!userId || !email) throw new Error("Session expired.");

      const socials = {
        ...(instagram.trim() && { instagram: instagram.trim() }),
        ...(linkedin.trim() && { linkedin: linkedin.trim() }),
        ...(discord.trim() && { discord: discord.trim() }),
      };

      await createProfile({
        userId,
        email,
        homeArea: homeArea.trim(),
        destination: campus,
        socials,
      });

      setProfile({
        displayName: name.trim(),
        homeArea: homeArea.trim(),
        destination: campus,
        ...(major.trim() && { faculty: major.trim() }),
        ...(year && { year }),
        socials,
      });

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Display name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Jessi"
            style={styles.input}
          />

          <Text style={styles.label}>Home area</Text>
          <Input
            value={homeArea}
            onChangeText={setHomeArea}
            placeholder="e.g. Burnaby, Richmond, Surrey"
            style={styles.input}
          />

          <Text style={styles.label}>Campus</Text>
          <View style={styles.chipRow}>
            {CAMPUSES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCampus(c)}
                style={[styles.chip, campus === c && styles.chipSelected]}
              >
                <Text style={[styles.chipText, campus === c && styles.chipTextSelected]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Major</Text>
          <Input
            value={major}
            onChangeText={setMajor}
            placeholder="e.g. Computer Science (optional)"
            style={styles.input}
          />

          <Text style={styles.label}>Year</Text>
          <View style={styles.chipRow}>
            {YEARS.map((y) => (
              <Pressable
                key={y}
                onPress={() => setYear(y)}
                style={[styles.chip, year === y && styles.chipSelected]}
              >
                <Text style={[styles.chipText, year === y && styles.chipTextSelected]}>
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Social handles</Text>

          <Text style={styles.label}>Instagram</Text>
          <Input
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@yourhandle"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>LinkedIn</Text>
          <Input
            value={linkedin}
            onChangeText={setLinkedin}
            placeholder="linkedin.com/in/you"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Discord</Text>
          <Input
            value={discord}
            onChangeText={setDiscord}
            placeholder="username#1234"
            autoCapitalize="none"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.saveButton}>
            <Button label="Save Changes" onPress={handleSave} variant="primary" loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fontFamilyDisplay.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: theme.spacing.lg,
  },
  input: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fontFamilyDisplay.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary + "15",
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.normal,
    color: theme.colors.textPrimary,
  },
  chipTextSelected: {
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.primary,
  },
  error: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.normal,
    color: theme.colors.destructive,
    marginTop: theme.spacing.md,
  },
  saveButton: {
    marginTop: theme.spacing.xl,
  },
});
