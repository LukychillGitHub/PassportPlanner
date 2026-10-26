import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TopPlace } from '../../types';
import { colors, radius, spacing } from '../../theme';

type Props = {
  visible: boolean;
  categoryName: string;
  places: TopPlace[];
  // Orden con el que arranca (lo ya guardado + los lugares nuevos al final).
  initialOrder: string[];
  // Lugares que la persona todavía no había ordenado, para marcarlos.
  unrankedIds: string[];
  onClose: () => void;
  onSave: (placeIds: string[]) => Promise<boolean>;
};

export function RankingEditorModal({
  visible,
  categoryName,
  places,
  initialOrder,
  unrankedIds,
  onClose,
  onSave,
}: Props) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setOrder(initialOrder);
    // Solo al abrir: si cambia en vivo mientras ordenás, no te pisa lo que estás moviendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setBusy(true);
    const ok = await onSave(order);
    setBusy(false);
    if (ok) onClose();
  }

  const nameOf = (id: string) => places.find((p) => p.id === id)?.name ?? '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Tu top</Text>
          <Text style={styles.title}>{categoryName}</Text>
          <Text style={styles.help}>Ordená del mejor (arriba) al peor (abajo) con las flechas.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {order.map((id, index) => (
            <View key={id} style={styles.row}>
              <Text style={[styles.position, index < 3 && styles.positionPodium]}>{index + 1}º</Text>
              <View style={styles.nameBox}>
                <Text style={styles.name}>{nameOf(id)}</Text>
                {unrankedIds.includes(id) && <Text style={styles.newTag}>Sin ordenar todavía</Text>}
              </View>
              <TouchableOpacity
                style={[styles.arrow, index === 0 && styles.arrowDisabled]}
                onPress={() => move(index, -1)}
                disabled={index === 0}
                accessibilityRole="button"
                accessibilityLabel={`Subir ${nameOf(id)}`}
              >
                <Text style={styles.arrowText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arrow, index === order.length - 1 && styles.arrowDisabled]}
                onPress={() => move(index, 1)}
                disabled={index === order.length - 1}
                accessibilityRole="button"
                accessibilityLabel={`Bajar ${nameOf(id)}`}
              >
                <Text style={styles.arrowText}>↓</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={busy}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryButton, busy && styles.disabled]} onPress={handleSave} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? 'Guardando...' : 'Guardar mi top'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 2 },
  help: { fontSize: 13, color: colors.inkMuted, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  position: { width: 34, fontSize: 16, fontWeight: '800', color: colors.inkMuted },
  positionPodium: { color: colors.primary },
  nameBox: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  newTag: { fontSize: 11, color: colors.accent, fontWeight: '600', marginTop: 2 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.25 },
  arrowText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
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
