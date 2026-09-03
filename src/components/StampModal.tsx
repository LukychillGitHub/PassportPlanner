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

type Props = {
  visible: boolean;
  activity: Activity | null;
  existingStamp?: Stamp;
  onClose: () => void;
  onConfirm: (rating: number, note: string, photoUri: string | null) => void;
  onRemoveStamp?: () => void;
};

export function StampModal({ visible, activity, existingStamp, onClose, onConfirm, onRemoveStamp }: Props) {
  const [rating, setRating] = useState(existingStamp?.rating ?? 0);
  const [note, setNote] = useState(existingStamp?.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(existingStamp?.photoUri ?? null);

  useEffect(() => {
    if (visible) {
      setRating(existingStamp?.rating ?? 0);
      setNote(existingStamp?.note ?? '');
      setPhotoUri(existingStamp?.photoUri ?? null);
    }
  }, [visible, existingStamp]);

  if (!activity) return null;

  const canConfirm = rating > 0;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para agregar una imagen de la actividad.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
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

            <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderText}>Agregar foto</Text>
                </View>
              )}
              {!!photoUri && (
                <View style={styles.photoEditBadge}>
                  <Text style={styles.photoEditBadgeText}>Cambiar</Text>
                </View>
              )}
            </TouchableOpacity>

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
                onPress={() => onConfirm(rating, note.trim(), photoUri)}
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
  photoPicker: {
    width: '100%',
    marginBottom: spacing.md,
  },
  photo: {
    width: '100%',
    height: 150,
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
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  photoPlaceholderText: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  photoEditBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.overlay,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoEditBadgeText: {
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
