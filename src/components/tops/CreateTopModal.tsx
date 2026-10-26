import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { colors, radius, spacing } from '../../theme';

const EMOJIS = ['🍔', '🍕', '🍣', '🌮', '🍦', '☕', '🍺', '🍷', '🎬', '🏖️', '🎵', '🏆'];

export type TopDraft = { title: string; emoji: string; categories: string[] };

type Props = {
  visible: boolean;
  initial?: TopDraft;
  onClose: () => void;
  onCreate: (draft: TopDraft) => Promise<boolean>;
};

export function CreateTopModal({ visible, initial, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🏆');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? '');
      setEmoji(initial?.emoji ?? '🏆');
      setCategories(initial?.categories ?? []);
      setNewCategory('');
    }
  }, [visible, initial]);

  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setNewCategory('');
      return;
    }
    setCategories((prev) => [...prev, name]);
    setNewCategory('');
  }

  async function handleCreate() {
    const pending = newCategory.trim();
    const finalCategories = pending && !categories.includes(pending) ? [...categories, pending] : categories;
    if (!title.trim()) {
      Alert.alert('Falta el nombre', 'Ponele un nombre al top, por ejemplo "Hamburgueserías".');
      return;
    }
    if (finalCategories.length === 0) {
      Alert.alert('Falta una categoría', 'Agregá al menos una cosa para evaluar, por ejemplo "Hamburguesa".');
      return;
    }
    setBusy(true);
    const ok = await onCreate({ title: title.trim(), emoji, categories: finalCategories });
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Nuevo top</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Hamburgueserías"
              placeholderTextColor={colors.inkMuted}
            />

            <Text style={styles.label}>Ícono</Text>
            <View style={styles.emojiRow}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, e === emoji && styles.emojiOptionActive]}
                  onPress={() => setEmoji(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ícono ${e}`}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Qué van a evaluar</Text>
            <Text style={styles.help}>Cada uno arma su propio top en cada categoría.</Text>
            <View style={styles.chipsRow}>
              {categories.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                  <TouchableOpacity
                    onPress={() => setCategories((prev) => prev.filter((x) => x !== c))}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${c}`}
                    hitSlop={8}
                  >
                    <Text style={styles.chipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, styles.addInput]}
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Ej: Papas fritas"
                placeholderTextColor={colors.inkMuted}
                onSubmitEditing={addCategory}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={addCategory}>
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={busy}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, busy && styles.disabled]}
                onPress={handleCreate}
                disabled={busy}
              >
                <Text style={styles.primaryButtonText}>{busy ? 'Creando...' : 'Crear top'}</Text>
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
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  content: { padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  help: { fontSize: 13, color: colors.inkMuted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  emojiOption: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emojiOptionActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.background },
  emojiText: { fontSize: 22 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: { color: colors.ink, fontWeight: '600' },
  chipRemove: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addInput: { flex: 1 },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  addButtonText: { color: colors.primary, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryButtonText: { color: colors.ink, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
