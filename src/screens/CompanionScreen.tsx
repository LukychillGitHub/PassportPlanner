import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Companion } from '../types';
import { colors, radius, spacing } from '../theme';
import { StarRating } from '../components/StarRating';
import { CompanionRatingModal } from '../components/CompanionRatingModal';

export function CompanionScreen() {
  const { session, companions, getCompanionRating, rateCompanion, isLeader, removeMember } = useApp();
  const [ratingTarget, setRatingTarget] = useState<Companion | null>(null);
  const myUserId = session?.user?.id;

  async function handleConfirmRating(rating: number, note: string) {
    if (!ratingTarget) return;
    await rateCompanion(ratingTarget.userId, rating, note);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setRatingTarget(null);
  }

  function handleRemoveMember(companion: Companion) {
    Alert.alert(
      'Sacar del pasaporte',
      `¿Seguro que querés sacar a ${companion.name || 'esta persona'} del pasaporte? Va a perder el acceso a las actividades y sellos compartidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sacar',
          style: 'destructive',
          onPress: async () => {
            const result = await removeMember(companion.userId);
            if (!result.ok) {
              Alert.alert('No se pudo sacar', result.error ?? 'Probá de nuevo.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compañero</Text>
        <Text style={styles.headerSubtitle}>Calificate mutuamente y contá cómo la vienen llevando</Text>
      </View>

      {companions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🤝</Text>
          <Text style={styles.emptyStateText}>
            Todavía no hay nadie más en tu pasaporte. Compartí tu código de invitación desde Cuenta para que se
            unan.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {companions.map((companion) => {
            const myRating = myUserId ? getCompanionRating(myUserId, companion.userId) : undefined;
            const theirRating = myUserId ? getCompanionRating(companion.userId, myUserId) : undefined;
            return (
              <View key={companion.userId} style={styles.card}>
                <View style={styles.profileRow}>
                  {companion.photoUri ? (
                    <Image source={{ uri: companion.photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarPlaceholderText}>
                        {companion.name.trim().charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{companion.name || 'Sin nombre'}</Text>
                    {!!companion.bio && <Text style={styles.profileBio}>{companion.bio}</Text>}
                  </View>
                  {isLeader && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(companion)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sacar a ${companion.name || 'esta persona'} del pasaporte`}
                    >
                      <Text style={styles.removeLink}>Sacar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.ratingBlock}>
                  <Text style={styles.ratingLabel}>Tu calificación</Text>
                  {myRating ? (
                    <>
                      <StarRating rating={myRating.rating} readOnly size={20} />
                      {!!myRating.note && <Text style={styles.note}>“{myRating.note}”</Text>}
                    </>
                  ) : (
                    <Text style={styles.noRatingText}>Todavía no la/lo calificaste.</Text>
                  )}
                  <TouchableOpacity style={styles.rateButton} onPress={() => setRatingTarget(companion)}>
                    <Text style={styles.rateButtonText}>{myRating ? 'Editar calificación' : 'Calificar'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.ratingBlock, styles.ratingBlockLast]}>
                  <Text style={styles.ratingLabel}>Te calificó a vos</Text>
                  {theirRating ? (
                    <>
                      <StarRating rating={theirRating.rating} readOnly size={20} />
                      {!!theirRating.note && <Text style={styles.note}>“{theirRating.note}”</Text>}
                    </>
                  ) : (
                    <Text style={styles.noRatingText}>Todavía no te calificó.</Text>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <CompanionRatingModal
        visible={!!ratingTarget}
        companion={ratingTarget}
        existingRating={
          ratingTarget && myUserId ? getCompanionRating(myUserId, ratingTarget.userId) : undefined
        }
        onClose={() => setRatingTarget(null)}
        onConfirm={handleConfirmRating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyStateText: {
    color: colors.inkMuted,
    textAlign: 'center',
    fontSize: 15,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  profileBio: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  removeLink: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  ratingBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  ratingBlockLast: {
    marginBottom: 0,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  noRatingText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
  note: {
    fontStyle: 'italic',
    color: colors.ink,
    marginTop: spacing.xs,
  },
  rateButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
  },
  rateButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
