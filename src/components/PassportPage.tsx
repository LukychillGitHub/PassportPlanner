import React from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Sharing from 'expo-sharing';
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

export function PassportPage({ activity, stamp, isAdmin, onSealPress, onEditPress }: Props) {
  const isStamped = !!stamp;

  async function handleShare() {
    if (!stamp) return;
    const stars = '★'.repeat(stamp.rating) + '☆'.repeat(5 - stamp.rating);
    const message = `${activity.title}\n${stars}${stamp.note ? `\n"${stamp.note}"` : ''}\n\n— Mi Pasaporte de Actividades`;
    try {
      if (stamp.photoUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(stamp.photoUri, { dialogTitle: activity.title });
      } else {
        await Share.share({ message });
      }
    } catch {
      // el usuario canceló el share sheet o no hay app disponible; no hace falta avisar
    }
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.category}>{activity.category.toUpperCase()}</Text>
            <Text style={styles.title}>{activity.title}</Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              onPress={onEditPress}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={`Editar actividad ${activity.title}`}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!activity.description && <Text style={styles.description}>{activity.description}</Text>}

        {isStamped ? (
          <View style={styles.stampBlock}>
            {!!stamp!.photoUri && (
              <View style={styles.photoWrap}>
                <Image source={{ uri: stamp!.photoUri }} style={styles.photo} />
                <View style={styles.photoStamp}>
                  <Text style={styles.photoStampText}>★</Text>
                </View>
              </View>
            )}

            <View style={styles.stampBadge}>
              <Text style={styles.stampBadgeText}>SELLADO</Text>
            </View>
            <StarRating rating={stamp!.rating} readOnly size={20} />
            {!!stamp!.note && <Text style={styles.note}>“{stamp!.note}”</Text>}
            <View style={styles.stampActionsRow}>
              <TouchableOpacity onPress={onSealPress} style={styles.editStampButton}>
                <Text style={styles.editStampButtonText}>Editar sello</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.editStampButton}
                accessibilityRole="button"
                accessibilityLabel="Compartir sello"
              >
                <Text style={styles.editStampButtonText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sealArea}>
            <TouchableOpacity style={styles.sealButton} onPress={onSealPress}>
              <Text style={styles.sealButtonIcon}>🖋️</Text>
              <Text style={styles.sealButtonText}>Sellar</Text>
            </TouchableOpacity>
            <Text style={styles.sealHint}>Tocá para sellar cuando la hagas</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.sm,
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
  sealArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  sealButton: {
    backgroundColor: colors.primary,
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
  },
  sealButtonIcon: {
    fontSize: 26,
  },
  sealButtonText: {
    color: colors.white,
    fontWeight: '700',
    marginTop: 2,
  },
  sealHint: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontSize: 13,
  },
  stampBlock: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
  },
  photoWrap: {
    marginBottom: spacing.md,
  },
  photo: {
    width: '100%',
    // Coincide con el aspect={4/3} del recorte en StampModal, para que el
    // encuadre que el usuario eligió al recortar sea exactamente el que se
    // ve en el sello (sin un recorte extra por un aspect ratio distinto).
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  photoStamp: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  photoStampText: {
    color: colors.white,
    fontSize: 16,
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
  stampActionsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  editStampButton: {
    marginTop: spacing.md,
  },
  editStampButtonText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
