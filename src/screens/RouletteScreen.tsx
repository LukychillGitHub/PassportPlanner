import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { Activity } from '../types';
import { colors, radius, spacing } from '../theme';
import { Wheel, WheelHandle } from '../components/Wheel';

export function RouletteScreen() {
  const { activities, getStamp } = useApp();
  const { width } = useWindowDimensions();
  const [onlyPending, setOnlyPending] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Activity | null>(null);
  const wheelRef = useRef<WheelHandle>(null);

  const pool = useMemo(() => {
    const list = onlyPending ? activities.filter((a) => !getStamp(a.id)) : activities;
    return list;
  }, [activities, onlyPending, getStamp]);

  const wheelSize = Math.min(width - spacing.lg * 2, 320);

  function handleSpin() {
    if (pool.length < 2 || spinning) return;
    setWinner(null);
    wheelRef.current?.spin();
  }

  return (
    <View style={styles.flex}>
      <Text style={styles.header}>Ruleta de planes</Text>
      <Text style={styles.subtitle}>Dejá que el azar elija tu próxima actividad</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, onlyPending && styles.filterChipActive]}
          onPress={() => setOnlyPending(true)}
        >
          <Text style={[styles.filterChipText, onlyPending && styles.filterChipTextActive]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, !onlyPending && styles.filterChipActive]}
          onPress={() => setOnlyPending(false)}
        >
          <Text style={[styles.filterChipText, !onlyPending && styles.filterChipTextActive]}>Todas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.wheelArea}>
        {pool.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activities.length < 2
                ? 'Agregá al menos dos actividades en el Pasaporte para poder girar la ruleta.'
                : 'Ya sellaste todas las actividades pendientes. Probá con "Todas".'}
            </Text>
          </View>
        ) : (
          <Wheel
            ref={wheelRef}
            activities={pool}
            size={wheelSize}
            onSpinStart={() => setSpinning(true)}
            onSpinEnd={(activity) => {
              setSpinning(false);
              setWinner(activity);
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.spinButton, (pool.length < 2 || spinning) && styles.spinButtonDisabled]}
        onPress={handleSpin}
        disabled={pool.length < 2 || spinning}
      >
        <Text style={styles.spinButtonText}>{spinning ? 'Girando...' : 'Girar la ruleta'}</Text>
      </TouchableOpacity>

      {winner && !spinning && (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Tu próxima actividad es</Text>
          <Text style={styles.resultTitle}>{winner.title}</Text>
          {!!winner.description && <Text style={styles.resultDescription}>{winner.description}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  wheelArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: spacing.xl,
  },
  emptyStateText: {
    color: colors.inkMuted,
    textAlign: 'center',
    fontSize: 15,
  },
  spinButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  spinButtonDisabled: {
    opacity: 0.5,
  },
  spinButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: colors.inkMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 4,
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
