import React from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import { MOCK_USER } from '@/constants/mockData';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { theme } from '@/constants/theme';

export default function ProfileScreen() {
  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile action registered');
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' },
    ]);
  };

  const hasSocials =
    MOCK_USER.socials &&
    (MOCK_USER.socials.instagram || MOCK_USER.socials.linkedin || MOCK_USER.socials.discord);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Avatar name={MOCK_USER.displayName} size={80} />
          <Text style={styles.displayName}>{MOCK_USER.displayName}</Text>
        </View>

        <Card title="Details">
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Home Area</Text>
            <Text style={styles.detailValue}>{MOCK_USER.homeArea}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Campus</Text>
            <Text style={styles.detailValue}>{MOCK_USER.campusDestination}</Text>
          </View>
          {MOCK_USER.faculty && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Faculty</Text>
              <Text style={styles.detailValue}>{MOCK_USER.faculty}</Text>
            </View>
          )}
          {MOCK_USER.year && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year</Text>
              <Text style={styles.detailValue}>{MOCK_USER.year}</Text>
            </View>
          )}
        </Card>

        <Card title="Social Handles">
          {hasSocials ? (
            <View>
              {MOCK_USER.socials!.instagram && (
                <Text style={styles.socialText}>
                  Instagram: {MOCK_USER.socials!.instagram}
                </Text>
              )}
              {MOCK_USER.socials!.linkedin && (
                <Text style={styles.socialText}>
                  LinkedIn: {MOCK_USER.socials!.linkedin}
                </Text>
              )}
              {MOCK_USER.socials!.discord && (
                <Text style={styles.socialText}>
                  Discord: {MOCK_USER.socials!.discord}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noSocialsText}>No social handles added</Text>
          )}
        </Card>

        <View style={styles.buttonSection}>
          <Button
            label="Edit Profile"
            onPress={handleEditProfile}
            variant="secondary"
          />
          <View style={styles.buttonSpacer} />
          <Button
            label="Delete Account"
            onPress={handleDeleteAccount}
            variant="destructive"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  displayName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textPrimary,
  },
  socialText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  noSocialsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonSection: {
    marginTop: theme.spacing.xl,
  },
  buttonSpacer: {
    height: theme.spacing.md,
  },
});
