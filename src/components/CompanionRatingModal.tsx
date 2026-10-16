import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Companion, CompanionRating } from '../types';
import { colors, radius, spacing } from '../theme';
import { StarRating } from './StarRating';

type Props = {
  visible: boolean;
  companion: Companion | null;
  existingRating?: CompanionRating;
  onClose: () => void;
  onConfirm: (rating: number, note: string) => void;
};

export function CompanionRatingModal({ visible, companion, existingRating, onClose, onConfirm }: Props) {
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [note, setNote] = useState(existingRating?.note ?? '');

  useEffect(() => {
    if (visible) {
      setRating(existingRating?.rating ?? 0);
      setNote(existingRating?.note ?? '');
    }
  }, [visible, existingRating]);

  if (!companion) return null;

  const canConfirm = rating > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.icon}>🤝</Text>
            <Text style={styles.title}>{companion.name || 'Tu compañero'}</Text>
            <Text style={styles.subtitle}>¿Cómo la están llevando?</Text>

            <View style={styles.starsWrap}>
              <StarRating rating={rating} onChange={setRating} size={34} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Dejale una notita de cómo va todo..."
              placeholderTextColor={colors.inkMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, !canConfirm && styles.disabledButton]}
                disabled={!canConfirm}
                onPress={() => onConfirm(rating, note.trim())}
              >
                <Text style={styles.primaryButtonText}>{existingRating ? 'Actualizar' : 'Calificar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  scrollContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  starsWrap: {
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
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
});
