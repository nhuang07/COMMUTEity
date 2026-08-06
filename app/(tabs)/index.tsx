import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGreeting } from '@/utils/greeting';
import { formatScheduleTime } from '@/utils/timeFormat';
import { MOCK_USER, MOCK_SCHEDULE } from '@/constants/mockData';
import { Card } from '@/components/Card';
import { theme } from '@/constants/theme';

export default function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.greeting}>
          {greeting}, {MOCK_USER.displayName}
        </Text>

        <Text style={styles.sectionTitle}>Today's Schedule</Text>

        {MOCK_SCHEDULE.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No classes scheduled for today
            </Text>
          </View>
        ) : (
          MOCK_SCHEDULE.map((entry) => (
            <Card key={entry.courseName + entry.time} variant="default">
              <View style={styles.scheduleEntry}>
                <Text style={styles.courseName}>{entry.courseName}</Text>
                <Text style={styles.scheduleDetail}>
                  {formatScheduleTime(entry.time)}
                </Text>
                <Text style={styles.scheduleDetail}>{entry.location}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
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
  scheduleEntry: {
    gap: theme.spacing.xs,
  },
  courseName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  scheduleDetail: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textSecondary,
  },
});
