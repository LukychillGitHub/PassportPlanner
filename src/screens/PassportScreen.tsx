import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Activity } from '../types';
import { colors, radius, spacing } from '../theme';
import { PassportBook, PassportBookHandle } from '../components/PassportBook';
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
  const bookRef = useRef<PassportBookHandle>(null);

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
      bookRef.current?.scrollToIndex(0);
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

      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Todavía no hay actividades en el pasaporte.
            {isAdmin ? ' Tocá "+ Actividad" para agregar la primera.' : ''}
          </Text>
        </View>
      ) : (
        <View style={styles.bookArea}>
          <PassportBook
            ref={bookRef}
            activities={activities}
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
