import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Activity } from '../types';
import { colors, radius, spacing } from '../theme';
import { ActivityCard } from '../components/ActivityCard';
import { StampModal } from '../components/StampModal';
import { ActivityFormModal } from '../components/ActivityFormModal';

export function PassportScreen() {
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

  const stampedCount = activities.filter((a) => getStamp(a.id)).length;

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
      await addActivity(data);
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

  async function handleStampConfirm(rating: number, note: string) {
    if (!stampTarget) return;
    await stampActivity(stampTarget.id, rating, note);
    setStampTarget(null);
  }

  async function handleRemoveStamp() {
    if (!stampTarget) return;
    await removeStamp(stampTarget.id);
    setStampTarget(null);
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi pasaporte</Text>
          <Text style={styles.headerSubtitle}>
            {stampedCount} de {activities.length} actividades selladas
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={openNewActivityForm}>
            <Text style={styles.addButtonText}>+ Actividad</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Todavía no hay actividades en el pasaporte.
              {isAdmin ? ' Tocá "+ Actividad" para agregar la primera.' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            stamp={getStamp(item.id)}
            isAdmin={isAdmin}
            onSealPress={() => setStampTarget(item)}
            onEditPress={() => openEditActivityForm(item)}
          />
        )}
      />

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
        onClose={() => {
          setFormVisible(false);
          setEditingActivity(null);
        }}
        onSubmit={handleFormSubmit}
        onDelete={editingActivity ? handleDeleteActivity : undefined}
      />
    </View>
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
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.inkMuted,
    textAlign: 'center',
    fontSize: 15,
  },
});
