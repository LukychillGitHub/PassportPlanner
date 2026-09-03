import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Activity } from '../types';
import { colors, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  activity?: Activity | null;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; category: string }) => void;
  onDelete?: () => void;
};

export function ActivityFormModal({ visible, activity, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(activity?.title ?? '');
      setDescription(activity?.description ?? '');
      setCategory(activity?.category ?? '');
    }
  }, [visible, activity]);

  const canSubmit = title.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{activity ? 'Editar actividad' : 'Nueva actividad'}</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Picnic al atardecer"
            placeholderTextColor={colors.inkMuted}
          />

          <Text style={styles.label}>Categoría</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="Ej: Aire libre"
            placeholderTextColor={colors.inkMuted}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Breve descripción de la actividad"
            placeholderTextColor={colors.inkMuted}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, !canSubmit && styles.disabledButton]}
              disabled={!canSubmit}
              onPress={() =>
                onSubmit({ title: title.trim(), description: description.trim(), category: category.trim() || 'General' })
              }
            >
              <Text style={styles.primaryButtonText}>{activity ? 'Guardar cambios' : 'Agregar'}</Text>
            </TouchableOpacity>
          </View>

          {activity && onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Eliminar actividad</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
