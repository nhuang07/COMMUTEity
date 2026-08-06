import React from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView } from "react-native";
import { router } from "expo-router";
import { getProfile, getUserEmail, clearSession } from "@/lib/storage";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { theme } from "@/constants/theme";

export default function ProfileScreen() {
  const profile = getProfile();
  const email = getUserEmail();

  const displayName = profile?.displayName ?? "Commuter";
  const hasSocials =
    profile?.socials &&
    (profile.socials.instagram || profile.socials.linkedin || profile.socials.discord);

  function handleEditProfile() {
    Alert.alert("Edit Profile", "Profile editing coming soon.");
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          clearSession();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This will remove all your data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive" },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Avatar name={displayName} size={80} />
          <Text style={styles.displayName}>{displayName}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Card title="Details">
          {profile?.homeArea ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Home Area</Text>
              <Text style={styles.detailValue}>{profile.homeArea}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Campus</Text>
            <Text style={styles.detailValue}>{profile?.destination ?? "UBC Vancouver"}</Text>
          </View>
          {profile?.faculty ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Faculty</Text>
              <Text style={styles.detailValue}>{profile.faculty}</Text>
            </View>
          ) : null}
          {profile?.year ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year</Text>
              <Text style={styles.detailValue}>{profile.year}</Text>
            </View>
          ) : null}
        </Card>

        <Card title="Social Handles">
          {hasSocials ? (
            <View>
              {profile!.socials!.instagram ? (
                <Text style={styles.socialText}>Instagram: {profile!.socials!.instagram}</Text>
              ) : null}
              {profile!.socials!.linkedin ? (
                <Text style={styles.socialText}>LinkedIn: {profile!.socials!.linkedin}</Text>
              ) : null}
              {profile!.socials!.discord ? (
                <Text style={styles.socialText}>Discord: {profile!.socials!.discord}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noSocialsText}>No social handles added</Text>
          )}
        </Card>

        <View style={styles.buttonSection}>
          <Button label="Edit Profile" onPress={handleEditProfile} variant="secondary" />
          <View style={styles.buttonSpacer} />
          <Button label="Sign Out" onPress={handleSignOut} variant="secondary" />
          <View style={styles.buttonSpacer} />
          <Button label="Delete Account" onPress={handleDeleteAccount} variant="destructive" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  avatarSection: { alignItems: "center", marginBottom: theme.spacing.xl },
  displayName: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.textPrimary, marginTop: theme.spacing.md },
  email: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  detailLabel: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.textSecondary },
  detailValue: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary },
  socialText: { fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, paddingVertical: theme.spacing.xs },
  noSocialsText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontStyle: "italic" },
  buttonSection: { marginTop: theme.spacing.xl },
  buttonSpacer: { height: theme.spacing.md },
});
