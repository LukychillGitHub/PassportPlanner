import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Activity, Stamp } from '../types';
import { colors, radius, spacing } from '../theme';
import { StarRating } from './StarRating';
import { ImageCropperModal } from './ImageCropperModal';

const MAX_PHOTOS = 6;

type Props = {
  visible: boolean;
  activity: Activity | null;
  existingStamp?: Stamp;
  onClose: () => void;
  onConfirm: (rating: number, note: string, photoUris: string[]) => void;
  onRemoveStamp?: () => void;
};

export function StampModal({ visible, activity, existingStamp, onClose, onConfirm, onRemoveStamp }: Props) {
  const [rating, setRating] = useState(existingStamp?.rating ?? 0);
  const [note, setNote] = useState(existingStamp?.note ?? '');
  const [photoUris, setPhotoUris] = useState<string[]>(existingStamp?.photoUris ?? []);
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setRating(existingStamp?.rating ?? 0);
      setNote(existingStamp?.note ?? '');
      setPhotoUris(existingStamp?.photoUris ?? []);
    }
  }, [visible, existingStamp]);

  if (!activity) return null;

  const canConfirm = rating > 0;
  const canAddMorePhotos = photoUris.length < MAX_PHOTOS;

  async function pickPhoto() {
    if (!canAddMorePhotos) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para agregar una imagen de la actividad.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPickedPhotoUri(result.assets[0].uri);
    }
  }

  function removePhoto(uri: string) {
    setPhotoUris((prev) => prev.filter((existing) => existing !== uri));
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stampIcon}>🏵️</Text>
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.subtitle}>¿Cómo estuvo la experiencia?</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoRow}
              contentContainerStyle={styles.photoRowContent}
            >
              {photoUris.map((uri) => (
                <View key={uri} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoRemoveBadge}
                    onPress={() => removePhoto(uri)}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar esta foto"
                  >
                    <Text style={styles.photoRemoveBadgeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {canAddMorePhotos && (
                <TouchableOpacity
                  style={[styles.photoThumb, styles.photoPlaceholder]}
                  onPress={pickPhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Agregar foto de la actividad"
                >
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>
                    {photoUris.length === 0 ? 'Agregar foto' : 'Agregar otra'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            {photoUris.length > 0 && (
              <Text style={styles.photoCount}>
                {photoUris.length} de {MAX_PHOTOS} fotos
              </Text>
            )}

            <View style={styles.starsWrap}>
              <StarRating rating={rating} onChange={setRating} size={34} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Contanos brevemente cómo te fue..."
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
                onPress={() => onConfirm(rating, note.trim(), photoUris)}
              >
                <Text style={styles.primaryButtonText}>
                  {existingStamp ? 'Actualizar sello' : 'Sellar pasaporte'}
                </Text>
              </TouchableOpacity>
            </View>

            {existingStamp && onRemoveStamp && (
              <TouchableOpacity onPress={onRemoveStamp} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Quitar sello</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {!!pickedPhotoUri && (
        <View style={StyleSheet.absoluteFill}>
          <ImageCropperModal
            asOverlay
            visible
            imageUri={pickedPhotoUri}
            aspect={4 / 3}
            shape="rect"
            onCancel={() => setPickedPhotoUri(null)}
            onConfirm={(croppedUri) => {
              setPhotoUris((prev) => [...prev, croppedUri]);
              setPickedPhotoUri(null);
            }}
          />
        </View>
      )}
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
  stampIcon: {
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
  photoRow: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  photoRowContent: {
    gap: spacing.sm,
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  photoPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  photoPlaceholderText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  photoCount: {
    alignSelf: 'flex-start',
    color: colors.inkMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  photoRemoveBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
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
  removeButton: {
    marginTop: spacing.md,
  },
  removeButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
