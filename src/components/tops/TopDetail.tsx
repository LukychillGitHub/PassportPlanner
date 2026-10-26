import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Top, TopCategory, TopPlace, TopRanking } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { computeTopRanking, initialOrder } from '../../lib/topScoring';
import { RankingEditorModal } from './RankingEditorModal';

type Member = { userId: string; name: string };
type Result = { ok: boolean; error?: string };

type Props = {
  top: Top;
  categories: TopCategory[];
  places: TopPlace[];
  rankings: TopRanking[];
  members: Member[];
  myUserId: string;
  canManage: boolean;
  onBack: () => void;
  onDeleteTop: () => void;
  addPlace: (name: string) => Promise<Result>;
  deletePlace: (placeId: string) => Promise<Result>;
  addCategory: (name: string) => Promise<Result>;
  deleteCategory: (categoryId: string) => Promise<Result>;
  saveRanking: (categoryId: string, placeIds: string[]) => Promise<Result>;
};

const GENERAL = 'general';
const EVERYONE = 'everyone';

export function TopDetail({
  top,
  categories,
  places,
  rankings,
  members,
  myUserId,
  canManage,
  onBack,
  onDeleteTop,
  addPlace,
  deletePlace,
  addCategory,
  deleteCategory,
  saveRanking,
}: Props) {
  const [view, setView] = useState<string>(GENERAL);
  const [who, setWho] = useState<string>(EVERYONE);
  const [newPlace, setNewPlace] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Si se borró la categoría que estabas mirando, volvemos al General.
  const selectedCategory = categories.find((c) => c.id === view);
  const activeView = selectedCategory ? view : GENERAL;

  const ranked = useMemo(
    () =>
      computeTopRanking(places, categories, rankings, {
        categoryId: activeView === GENERAL ? undefined : activeView,
        userId: who === EVERYONE ? undefined : who,
      }),
    [places, categories, rankings, activeView, who]
  );
  const anyRanked = ranked.some((r) => r.rank > 0);

  const myRankingFor = (categoryId: string) =>
    rankings.find((r) => r.categoryId === categoryId && r.userId === myUserId);
  const editingCategory = categories.find((c) => c.id === editingCategoryId);
  const editingRanking = editingCategory ? myRankingFor(editingCategory.id) : undefined;
  const editingUnranked = places
    .filter((p) => !(editingRanking?.placeIds ?? []).includes(p.id))
    .map((p) => p.id);

  function openEditor(categoryId: string) {
    if (places.length === 0) {
      Alert.alert('Todavía no hay lugares', 'Sumá al menos un lugar abajo para poder armar tu top.');
      return;
    }
    setEditingCategoryId(categoryId);
  }

  async function handleAddPlace() {
    const name = newPlace.trim();
    if (!name) return;
    if (places.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Ya está en el top', `"${name}" ya figura en la lista.`);
      return;
    }
    const result = await addPlace(name);
    if (result.ok) setNewPlace('');
    else Alert.alert('No se pudo agregar', result.error ?? 'Probá de nuevo.');
  }

  async function handleAddCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const result = await addCategory(name);
    if (result.ok) setNewCategory('');
    else Alert.alert('No se pudo agregar', result.error ?? 'Probá de nuevo.');
  }

  function confirmDeletePlace(place: TopPlace) {
    Alert.alert('Quitar lugar', `¿Quitar "${place.name}" del top? Sale de los rankings de todos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          const result = await deletePlace(place.id);
          if (!result.ok) Alert.alert('No se pudo quitar', result.error ?? 'Probá de nuevo.');
        },
      },
    ]);
  }

  function confirmDeleteCategory(category: TopCategory) {
    Alert.alert(
      'Quitar categoría',
      `¿Quitar "${category.name}"? Se borra el orden que cada uno armó en esa categoría.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(category.id);
            if (!result.ok) Alert.alert('No se pudo quitar', result.error ?? 'Probá de nuevo.');
          },
        },
      ]
    );
  }

  const whoName = who === EVERYONE ? null : members.find((m) => m.userId === who)?.name;
  const viewName = selectedCategory?.name ?? 'General';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.back} accessibilityRole="button">
        <Text style={styles.backText}>‹ Tops</Text>
      </TouchableOpacity>
      <View style={styles.titleRow}>
        <Text style={styles.titleEmoji}>{top.emoji}</Text>
        <Text style={styles.title}>{top.title}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {[{ id: GENERAL, name: 'General' }, ...categories].map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.tab, activeView === c.id && styles.tabActive]}
            onPress={() => setView(c.id)}
          >
            <Text style={[styles.tabText, activeView === c.id && styles.tabTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.filters}>
        {[{ userId: EVERYONE, name: 'Todos' }, ...members].map((m) => (
          <TouchableOpacity
            key={m.userId}
            style={[styles.filter, who === m.userId && styles.filterActive]}
            onPress={() => setWho(m.userId)}
          >
            <Text style={[styles.filterText, who === m.userId && styles.filterTextActive]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.board}>
        <Text style={styles.boardTitle}>
          {whoName ? `Top de ${whoName}` : 'Top de todos'} · {viewName}
        </Text>
        {places.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay lugares. Sumá los que fueron probando más abajo.</Text>
        ) : !anyRanked ? (
          <Text style={styles.empty}>
            {whoName
              ? `${whoName} todavía no ordenó ${selectedCategory ? 'esta categoría' : 'ninguna categoría'}.`
              : 'Todavía nadie armó su top. Elegí una categoría y tocá "Ordenar mi top".'}
          </Text>
        ) : (
          ranked.map(({ place, rank }) => (
            <View key={place.id} style={styles.rankRow}>
              <View style={[styles.rankBadge, rank === 1 && styles.gold, rank === 2 && styles.silver, rank === 3 && styles.bronze]}>
                <Text style={[styles.rankText, rank >= 1 && rank <= 3 && styles.rankTextPodium]}>
                  {rank > 0 ? `${rank}º` : '–'}
                </Text>
              </View>
              <Text style={[styles.rankName, rank === 0 && styles.rankNameMuted]}>{place.name}</Text>
            </View>
          ))
        )}
      </View>

      {selectedCategory ? (
        <TouchableOpacity style={styles.primaryButton} onPress={() => openEditor(selectedCategory.id)}>
          <Text style={styles.primaryButtonText}>
            {myRankingFor(selectedCategory.id) ? 'Editar mi top de ' : 'Ordenar mi top de '}
            {selectedCategory.name}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tus categorías</Text>
          {categories.map((c) => {
            const done = !!myRankingFor(c.id)?.placeIds.length;
            return (
              <TouchableOpacity key={c.id} style={styles.myCategoryRow} onPress={() => openEditor(c.id)}>
                <Text style={styles.myCategoryName}>{c.name}</Text>
                <Text style={[styles.myCategoryStatus, done && styles.myCategoryDone]}>
                  {done ? 'Ordenado ✓' : 'Falta ordenar ›'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lugares ({places.length})</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={newPlace}
            onChangeText={setNewPlace}
            placeholder="Ej: Kiddo"
            placeholderTextColor={colors.inkMuted}
            onSubmitEditing={handleAddPlace}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddPlace}>
            <Text style={styles.addButtonText}>Sumar</Text>
          </TouchableOpacity>
        </View>
        {places.map((p) => (
          <View key={p.id} style={styles.manageRow}>
            <Text style={styles.manageName}>{p.name}</Text>
            {(canManage || p.createdBy === myUserId) && (
              <TouchableOpacity onPress={() => confirmDeletePlace(p)} hitSlop={8}>
                <Text style={styles.removeText}>Quitar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {canManage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          {categories.map((c) => (
            <View key={c.id} style={styles.manageRow}>
              <Text style={styles.manageName}>{c.name}</Text>
              {categories.length > 1 && (
                <TouchableOpacity onPress={() => confirmDeleteCategory(c)} hitSlop={8}>
                  <Text style={styles.removeText}>Quitar</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Ej: Atención"
              placeholderTextColor={colors.inkMuted}
              onSubmitEditing={handleAddCategory}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onDeleteTop} style={styles.deleteTop}>
            <Text style={styles.deleteTopText}>Eliminar este top</Text>
          </TouchableOpacity>
        </View>
      )}

      <RankingEditorModal
        visible={!!editingCategory}
        categoryName={editingCategory?.name ?? ''}
        places={places}
        initialOrder={initialOrder(places, editingRanking)}
        unrankedIds={editingRanking ? editingUnranked : []}
        onClose={() => setEditingCategoryId(null)}
        onSave={async (placeIds) => {
          if (!editingCategory) return false;
          const result = await saveRanking(editingCategory.id, placeIds);
          if (!result.ok) Alert.alert('No se pudo guardar', result.error ?? 'Probá de nuevo.');
          return result.ok;
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingTop: spacing.md, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  back: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleEmoji: { fontSize: 30 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, flex: 1 },
  tabs: { gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.ink, fontWeight: '700' },
  tabTextActive: { color: colors.white },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterText: { color: colors.inkMuted, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: colors.white },
  board: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  boardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  empty: { color: colors.inkMuted, fontSize: 14, paddingVertical: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gold: { backgroundColor: '#C99A3E', borderColor: '#C99A3E' },
  silver: { backgroundColor: '#9C9A94', borderColor: '#9C9A94' },
  bronze: { backgroundColor: '#A8683A', borderColor: '#A8683A' },
  rankText: { fontWeight: '800', color: colors.inkMuted },
  rankTextPodium: { color: colors.white },
  rankName: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.ink },
  rankNameMuted: { color: colors.inkMuted, fontWeight: '500' },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  myCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  myCategoryName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  myCategoryStatus: { fontSize: 13, fontWeight: '600', color: colors.accent },
  myCategoryDone: { color: colors.success },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  addButtonText: { color: colors.primary, fontWeight: '700' },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  manageName: { fontSize: 15, color: colors.ink, flex: 1 },
  removeText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  deleteTop: { alignSelf: 'center', marginTop: spacing.md },
  deleteTopText: { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline' },
});
