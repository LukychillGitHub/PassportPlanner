import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { TopPlace, TopPlacePhoto } from '../../types';
import { colors, radius, spacing } from '../../theme';
import { PhotoGallery } from '../PhotoGallery';
import { ImageCropperModal } from '../ImageCropperModal';

const MAX_PHOTOS = 10;

type Result = { ok: boolean; error?: string };

type Props = {
  place: TopPlace | null;
  photos: TopPlacePhoto[];
  // Puesto del lugar en la vista que se estaba mirando (0 = sin ordenar).
  rank: number;
  canRemovePhoto: (photo: TopPlacePhoto) => boolean;
  onClose: () => void;
  onAddPhoto: (url: string) => Promise<Result>;
  onRemovePhoto: (photoId: string) => Promise<Result>;
};

export function PlaceModal({ place, photos, rank, canRemovePhoto, onClose, onAddPhoto, onRemovePhoto }: Props) {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Límite de fotos', `Cada lugar puede tener hasta ${MAX_PHOTOS} fotos.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para sumar una imagen del lugar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled && result.assets?.[0]?.uri) setPickedUri(result.assets[0].uri);
  }

  async function handleCropped(url: string) {
    setPickedUri(null);
    // Si la subida falló, el recortador devuelve una ruta local del teléfono:
    // no la guardamos, porque los demás no la podrían ver.
    if (!url.startsWith('http')) return;
    setSaving(true);
    const result = await onAddPhoto(url);
    setSaving(false);
    if (!result.ok) Alert.alert('No se pudo guardar la foto', result.error ?? 'Probá de nuevo.');
  }

  function confirmRemove(photo: { id: string }) {
    Alert.alert('Quitar foto', '¿Quitar esta foto del lugar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          const result = await onRemovePhoto(photo.id);
          if (!result.ok) Alert.alert('No se pudo quitar', result.error ?? 'Probá de nuevo.');
        },
      },
    ]);
  }

  return (
    <Modal visible={!!place} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={styles.close}>‹ Volver</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.rank}>{rank > 0 ? `${rank}º en esta vista` : 'Sin ordenar todavía'}</Text>
          <Text style={styles.title}>{place?.name}</Text>

          {photos.length > 0 ? (
            <PhotoGallery
              photos={photos}
              onRemove={confirmRemove}
              canRemove={(p) => {
                const photo = photos.find((x) => x.id === p.id);
                return !!photo && canRemovePhoto(photo);
              }}
            />
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>Todavía no hay fotos de este lugar.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, saving && styles.disabled]}
            onPress={pickPhoto}
            disabled={saving}
          >
            <Text style={styles.addButtonText}>
              {saving ? 'Guardando foto...' : photos.length > 0 ? '+ Sumar otra foto' : '+ Sumar una foto'}
            </Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <Text style={styles.count}>
              {photos.length} de {MAX_PHOTOS} fotos
            </Text>
          )}
        </ScrollView>

        {!!pickedUri && (
          <View style={StyleSheet.absoluteFill}>
            <ImageCropperModal
              asOverlay
              visible
              imageUri={pickedUri}
              aspect={4 / 3}
              shape="rect"
              onCancel={() => setPickedUri(null)}
              onConfirm={handleCropped}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  close: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  content: { padding: spacing.lg, gap: spacing.md },
  rank: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: -spacing.sm },
  emptyPhotos: {
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: colors.inkMuted, fontSize: 14 },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  count: { textAlign: 'center', color: colors.inkMuted, fontSize: 12 },
  disabled: { opacity: 0.6 },
});
