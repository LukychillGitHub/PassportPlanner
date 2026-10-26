import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTops } from '../hooks/useTops';
import { computeTopRanking } from '../lib/topScoring';
import { colors, radius, spacing } from '../theme';
import { CreateTopModal, TopDraft } from '../components/tops/CreateTopModal';
import { TopDetail } from '../components/tops/TopDetail';

const EMPTY_DRAFT: TopDraft = { title: '', emoji: '🏆', categories: [] };

export function TopsScreen() {
  const { passport, session, companions, isLeader } = useApp();
  const myUserId = session?.user?.id ?? '';
  const data = useTops(passport?.id, myUserId);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<TopDraft | null>(null);

  const members = useMemo(
    () => [
      { userId: myUserId, name: 'Vos' },
      ...companions.map((c) => ({ userId: c.userId, name: c.name || 'Sin nombre' })),
    ],
    [myUserId, companions]
  );

  const selectedTop = data.tops.find((t) => t.id === selectedTopId);

  async function handleCreate(draft: TopDraft) {
    const result = await data.createTop(draft.title, draft.emoji, draft.categories);
    if (!result.ok) {
      Alert.alert('No se pudo crear el top', result.error ?? 'Probá de nuevo.');
      return false;
    }
    if (result.id) setSelectedTopId(result.id);
    return true;
  }

  if (selectedTop) {
    const canManage = selectedTop.createdBy === myUserId || isLeader;
    return (
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TopDetail
          top={selectedTop}
          categories={data.categories.filter((c) => c.topId === selectedTop.id)}
          places={data.places.filter((p) => p.topId === selectedTop.id)}
          rankings={data.rankings.filter((r) => r.topId === selectedTop.id)}
          photos={data.photos.filter((ph) =>
            data.places.some((p) => p.id === ph.placeId && p.topId === selectedTop.id)
          )}
          members={members}
          myUserId={myUserId}
          canManage={canManage}
          onBack={() => setSelectedTopId(null)}
          onDeleteTop={() =>
            Alert.alert('Eliminar top', `¿Eliminar "${selectedTop.title}" con todos sus lugares y rankings?`, [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                  const result = await data.deleteTop(selectedTop.id);
                  if (result.ok) setSelectedTopId(null);
                  else Alert.alert('No se pudo eliminar', result.error ?? 'Probá de nuevo.');
                },
              },
            ])
          }
          addPlace={(name) => data.addPlace(selectedTop.id, name)}
          deletePlace={data.deletePlace}
          addCategory={(name) => data.addCategory(selectedTop.id, name)}
          deleteCategory={data.deleteCategory}
          saveRanking={(categoryId, placeIds) => data.saveRanking(selectedTop.id, categoryId, placeIds)}
          addPlacePhoto={(placeId, url) => data.addPlacePhoto(selectedTop.id, placeId, url)}
          deletePlacePhoto={data.deletePlacePhoto}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Tops</Text>
            <Text style={styles.headerSubtitle}>Armen juntos el ranking de lo que vayan probando</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setCreateDraft(EMPTY_DRAFT)}>
            <Text style={styles.addButtonText}>+ Top</Text>
          </TouchableOpacity>
        </View>

        {data.loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : data.tops.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>Todavía no hay tops</Text>
            <Text style={styles.emptyText}>
              Creen un top de lo que quieran, elijan qué evaluar y cada uno arma su propio ranking.
            </Text>
            <TouchableOpacity style={styles.templateButton} onPress={() => setCreateDraft(EMPTY_DRAFT)}>
              <Text style={styles.templateButtonText}>Crear el primer top</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data.tops.map((top) => {
            const topPlaces = data.places.filter((p) => p.topId === top.id);
            const leader = computeTopRanking(
              topPlaces,
              data.categories.filter((c) => c.topId === top.id),
              data.rankings.filter((r) => r.topId === top.id),
              {}
            ).find((r) => r.rank === 1);
            return (
              <TouchableOpacity key={top.id} style={styles.topCard} onPress={() => setSelectedTopId(top.id)}>
                <Text style={styles.topEmoji}>{top.emoji}</Text>
                <View style={styles.topInfo}>
                  <Text style={styles.topTitle}>{top.title}</Text>
                  <Text style={styles.topMeta}>
                    {topPlaces.length} {topPlaces.length === 1 ? 'lugar' : 'lugares'}
                    {leader ? ` · 1º ${leader.place.name}` : ''}
                  </Text>
                </View>
                <Text style={styles.topArrow}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <CreateTopModal
        visible={!!createDraft}
        initial={createDraft ?? undefined}
        onClose={() => setCreateDraft(null)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingTop: spacing.lg + spacing.sm, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.ink },
  headerSubtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
  },
  addButtonText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  loader: { marginTop: spacing.xl },
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  emptyText: { fontSize: 14, color: colors.inkMuted, textAlign: 'center', maxWidth: 300 },
  templateButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  templateButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  topEmoji: { fontSize: 32 },
  topInfo: { flex: 1, minWidth: 0 },
  topTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  topMeta: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  topArrow: { fontSize: 26, color: colors.primary, fontWeight: '700' },
});
