import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { Activity } from '../types';
import { colors, radius, spacing } from '../theme';
import { PassportBook, PassportBookHandle } from '../components/PassportBook';
import { StampModal } from '../components/StampModal';
import { ActivityFormModal } from '../components/ActivityFormModal';

const ALL_CATEGORIES = 'Todas';

type Props = {
  route?: { params?: { focusActivityId?: string } };
  navigation?: { setParams: (params: Record<string, unknown>) => void };
};

export function PassportScreen({ route, navigation }: Props) {
  const {
    activities,
    getStamp,
    stampActivity,
    removeStamp,
    isAdmin,
    addActivity,
    updateActivity,
    deleteActivity,
  } = useApp();

  const [stampTarget, setStampTarget] = useState<Activity | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const bookRef = useRef<PassportBookHandle>(null);

  const stampedCount = activities.filter((a) => getStamp(a.id)).length;

  const categories = useMemo(
    () => Array.from(new Set(activities.map((a) => a.category).filter(Boolean))),
    [activities]
  );

  const visibleActivities = useMemo(
    () => (categoryFilter === ALL_CATEGORIES ? activities : activities.filter((a) => a.category === categoryFilter)),
    [activities, categoryFilter]
  );

  const focusActivityId = route?.params?.focusActivityId;
  const pendingFocusRef = useRef<string | null>(null);
  const pendingScrollTopRef = useRef(false);
  // Se incrementa cada vez que hay un scroll pendiente, para que el efecto de abajo
  // se dispare aunque `visibleActivities` no cambie de referencia (p. ej. el filtro
  // ya estaba en "Todas", así que resetearlo no genera un nuevo array memoizado).
  const [scrollAttempt, setScrollAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!focusActivityId) return;
      pendingFocusRef.current = focusActivityId;
      setCategoryFilter(ALL_CATEGORIES);
      setScrollAttempt((n) => n + 1);
      navigation?.setParams({ focusActivityId: undefined });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusActivityId])
  );

  useEffect(() => {
    if (pendingScrollTopRef.current) {
      bookRef.current?.scrollToIndex(0);
      pendingScrollTopRef.current = false;
      return;
    }
    if (!pendingFocusRef.current) return;
    const index = visibleActivities.findIndex((a) => a.id === pendingFocusRef.current);
    if (index >= 0) {
      bookRef.current?.scrollToIndex(index);
      pendingFocusRef.current = null;
    }
  }, [visibleActivities, scrollAttempt]);

  function openNewActivityForm() {
    setEditingActivity(null);
    setFormVisible(true);
  }

  function openEditActivityForm(activity: Activity) {
    setEditingActivity(activity);
    setFormVisible(true);
  }

  async function handleFormSubmit(data: { title: string; description: string; category: string }) {
    if (editingActivity) {
      await updateActivity(editingActivity.id, data);
    } else {
      pendingScrollTopRef.current = true;
      await addActivity(data);
      setCategoryFilter(ALL_CATEGORIES);
    }
    setFormVisible(false);
    setEditingActivity(null);
  }

  function handleDeleteActivity() {
    if (!editingActivity) return;
    Alert.alert('Eliminar actividad', `¿Seguro que querés eliminar "${editingActivity.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteActivity(editingActivity.id);
          setFormVisible(false);
          setEditingActivity(null);
        },
      },
    ]);
  }

  async function handleStampConfirm(rating: number, note: string, photoUri: string | null) {
    if (!stampTarget) return;
    await stampActivity(stampTarget.id, rating, note, photoUri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStampTarget(null);
  }

  async function handleRemoveStamp() {
    if (!stampTarget) return;
    await removeStamp(stampTarget.id);
    setStampTarget(null);
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi pasaporte</Text>
          <Text style={styles.headerSubtitle}>
            {stampedCount} de {activities.length} actividades selladas
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openNewActivityForm}
            accessibilityRole="button"
            accessibilityLabel="Agregar nueva actividad"
          >
            <Text style={styles.addButtonText}>+ Actividad</Text>
          </TouchableOpacity>
        )}
      </View>

      {activities.length > 1 && categories.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === ALL_CATEGORIES && styles.filterChipActive]}
            onPress={() => setCategoryFilter(ALL_CATEGORIES)}
          >
            <Text style={[styles.filterChipText, categoryFilter === ALL_CATEGORIES && styles.filterChipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.filterChip, categoryFilter === category && styles.filterChipActive]}
              onPress={() => setCategoryFilter(category)}
            >
              <Text style={[styles.filterChipText, categoryFilter === category && styles.filterChipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Todavía no hay actividades en el pasaporte.
            {isAdmin ? ' Tocá "+ Actividad" para agregar la primera.' : ''}
          </Text>
        </View>
      ) : visibleActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No hay actividades en la categoría "{categoryFilter}".</Text>
        </View>
      ) : (
        <View style={styles.bookArea}>
          <PassportBook
            ref={bookRef}
            activities={visibleActivities}
            getStamp={getStamp}
            isAdmin={isAdmin}
            onSealPress={setStampTarget}
            onEditPress={openEditActivityForm}
          />
        </View>
      )}

      <StampModal
        visible={!!stampTarget}
        activity={stampTarget}
        existingStamp={stampTarget ? getStamp(stampTarget.id) : undefined}
        onClose={() => setStampTarget(null)}
        onConfirm={handleStampConfirm}
        onRemoveStamp={stampTarget && getStamp(stampTarget.id) ? handleRemoveStamp : undefined}
      />

      <ActivityFormModal
        visible={formVisible}
        activity={editingActivity}
        categories={categories}
        onClose={() => {
          setFormVisible(false);
          setEditingActivity(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={editingActivity ? handleDeleteActivity : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
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
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
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
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  bookArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyState: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: colors.inkMuted,
    textAlign: 'center',
    fontSize: 15,
  },
});
