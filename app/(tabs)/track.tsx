import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { MOCK_USER } from '@/constants/mockData';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { formatElapsedTime } from '@/utils/timeFormat';

interface CommuteState {
  status: 'idle' | 'active';
  startedAt: number | null;
}

export default function TrackScreen() {
  const [commute, setCommute] = useState<CommuteState>({
    status: 'idle',
    startedAt: null,
  });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (commute.status === 'active' && commute.startedAt !== null) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - commute.startedAt!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [commute.status, commute.startedAt]);

  const handleToggle = () => {
    if (commute.status === 'idle') {
      const now = Date.now();
      setCommute({ status: 'active', startedAt: now });
      setElapsed(0);
    } else {
      setCommute({ status: 'idle', startedAt: null });
      setElapsed(0);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>Track Commute</Text>

        <Card title="Commute" subtitle={MOCK_USER.campusDestination}>
          {commute.status === 'active' && (
            <Text style={styles.elapsed}>{formatElapsedTime(elapsed)}</Text>
          )}
        </Card>

        <View style={styles.buttonContainer}>
          {commute.status === 'idle' ? (
            <Button
              label="Start Commute"
              onPress={handleToggle}
              variant="primary"
              size="large"
            />
          ) : (
            <Button
              label="End Commute"
              onPress={handleToggle}
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
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
  buttonContainer: {
    marginTop: theme.spacing.xl,
  },
});
