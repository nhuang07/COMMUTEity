import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { theme } from '@/constants/theme';
import { MOCK_MATCHES, MatchCardData } from '@/constants/mockData';
import { groupMatches } from '@/utils/matchHelpers';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

export default function MatchesScreen() {
  const [matches, setMatches] = useState<MatchCardData[]>(MOCK_MATCHES);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { pending, connected } = groupMatches(matches);

  const handleAccept = (matchId: string) => {
    setAcceptedIds((prev) => new Set(prev).add(matchId));
  };

  const handleNotInterested = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    setExpandedId(null);
  };

  const handleCardTap = (matchId: string) => {
    if (acceptedIds.has(matchId)) return;
    setExpandedId((prev) => (prev === matchId ? null : matchId));
  };

  if (matches.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>
            {pending.map((match) => (
              <Pressable
                key={match.matchId}
                onPress={() => handleCardTap(match.matchId)}
              >
                <Card variant="default">
                  <View style={styles.cardHeader}>
                    <Badge label="Pending" variant="default" />
                  </View>
                  <Text style={styles.explanation}>
                    {match.overlapExplanation}
                  </Text>
                  <Text style={styles.sharedWindow}>
                    {match.sharedWindow}
                  </Text>

                  {acceptedIds.has(match.matchId) && (
                    <View style={styles.waitingContainer}>
                      <Text style={styles.waitingText}>
                        Waiting for response
                      </Text>
                    </View>
                  )}

                  {expandedId === match.matchId && !acceptedIds.has(match.matchId) && (
                    <View style={styles.actionsRow}>
                      <Button
                        label="Accept"
                        variant="primary"
                        onPress={() => handleAccept(match.matchId)}
                      />
                      <Button
                        label="Not Interested"
                        variant="secondary"
                        onPress={() => handleNotInterested(match.matchId)}
                      />
                    </View>
                  )}
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {connected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connections</Text>
            {connected.map((match) => (
              <Card key={match.matchId} variant="default">
                <View style={styles.cardHeader}>
                  <Badge label="Connected" variant="success" />
                </View>
                <Text style={styles.displayName}>
                  {match.matchedUser.displayName}
                </Text>
                <View style={styles.detailsRow}>
                  {match.matchedUser.faculty && (
                    <Text style={styles.detailText}>
                      {match.matchedUser.faculty}
                    </Text>
                  )}
                  {match.matchedUser.year && (
                    <Text style={styles.detailText}>
                      Year {match.matchedUser.year}
                    </Text>
                  )}
                </View>
                {match.matchedUser.socials && (
                  <View style={styles.socialsContainer}>
                    {match.matchedUser.socials.instagram && (
                      <Text style={styles.socialHandle}>
                        Instagram: {match.matchedUser.socials.instagram}
                      </Text>
                    )}
                    {match.matchedUser.socials.linkedin && (
                      <Text style={styles.socialHandle}>
                        LinkedIn: {match.matchedUser.socials.linkedin}
                      </Text>
                    )}
                    {match.matchedUser.socials.discord && (
                      <Text style={styles.socialHandle}>
                        Discord: {match.matchedUser.socials.discord}
                      </Text>
                    )}
                  </View>
                )}
                <Text style={styles.explanation}>
                  {match.overlapExplanation}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  cardHeader: {
    marginBottom: theme.spacing.sm,
  },
  explanation: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  sharedWindow: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  displayName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
  socialsContainer: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  socialHandle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  waitingContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
});
