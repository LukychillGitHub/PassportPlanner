import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity, Stamp } from '../types';
import { colors, radius, spacing } from '../theme';
import { StarRating } from './StarRating';

type Props = {
  activity: Activity;
  stamp?: Stamp;
  isAdmin: boolean;
  onSealPress: () => void;
  onEditPress: () => void;
};

export function ActivityCard({ activity, stamp, isAdmin, onSealPress, onEditPress }: Props) {
  const isStamped = !!stamp;

  return (
    <View style={[styles.card, isStamped && styles.cardStamped]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{activity.category.toUpperCase()}</Text>
          <Text style={styles.title}>{activity.title}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!activity.description && <Text style={styles.description}>{activity.description}</Text>}

      {isStamped ? (
        <View style={styles.stampBlock}>
          <View style={styles.stampBadge}>
            <Text style={styles.stampBadgeText}>SELLADO</Text>
          </View>
          <StarRating rating={stamp!.rating} readOnly size={18} />
          {!!stamp!.note && <Text style={styles.note}>“{stamp!.note}”</Text>}
          <TouchableOpacity onPress={onSealPress} style={styles.editStampButton}>
            <Text style={styles.editStampButtonText}>Editar sello</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.sealButton} onPress={onSealPress}>
          <Text style={styles.sealButtonText}>🖋️ Sellar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardStamped: {
    borderColor: colors.gold,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  sealButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  sealButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  stampBlock: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  stampBadge: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    transform: [{ rotate: '-4deg' }],
    marginBottom: spacing.xs,
  },
  stampBadgeText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  note: {
    fontStyle: 'italic',
    color: colors.ink,
    marginTop: spacing.xs,
  },
  editStampButton: {
    marginTop: spacing.sm,
  },
  editStampButtonText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
