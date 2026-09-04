import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  imageUri: string | null;
  aspect: number; // width / height del recorte deseado
  shape?: 'circle' | 'rect';
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const FRAME_MAX_WIDTH = 300;

// Sube la imagen recortada (que vive en un directorio de caché temporal) a
// Supabase Storage, para que la otra persona del pasaporte compartido
// también pueda verla, y no se pierda si se limpia la caché del dispositivo.
async function persistPhoto(uri: string): Promise<{ uri: string; uploaded: boolean }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(path, blob, {
      contentType: 'image/jpeg',
    });
    if (error) throw error;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return { uri: data.publicUrl, uploaded: true };
  } catch {
    return { uri, uploaded: false };
  }
}

export function ImageCropperModal({ visible, imageUri, aspect, shape = 'rect', onCancel, onConfirm }: Props) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const displayedSizeRef = useRef({ width: 0, height: 0 });

  const frameWidth = FRAME_MAX_WIDTH;
  const frameHeight = frameWidth / aspect;

  useEffect(() => {
    if (visible && imageUri) {
      setNaturalSize(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      Image.getSize(
        imageUri,
        (width, height) => setNaturalSize({ width, height }),
        () => setNaturalSize({ width: frameWidth, height: frameHeight })
      );
    }
  }, [visible, imageUri]);

  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(frameWidth / naturalSize.width, frameHeight / naturalSize.height);
  }, [naturalSize, frameWidth, frameHeight]);

  const displayedScale = baseScale * zoom;
  const displayedWidth = naturalSize ? naturalSize.width * displayedScale : frameWidth;
  const displayedHeight = naturalSize ? naturalSize.height * displayedScale : frameHeight;

  panRef.current = pan;
  displayedSizeRef.current = { width: displayedWidth, height: displayedHeight };

  function clampPan(x: number, y: number, w: number, h: number) {
    const maxX = Math.max(0, (w - frameWidth) / 2);
    const maxY = Math.max(0, (h - frameHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        panStart.current = panRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const { width, height } = displayedSizeRef.current;
        const next = clampPan(panStart.current.x + gesture.dx, panStart.current.y + gesture.dy, width, height);
        panRef.current = next;
        setPan(next);
      },
    })
  ).current;

  function changeZoom(delta: number) {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom + delta));
      if (!naturalSize) return nextZoom;
      const nextScale = baseScale * nextZoom;
      const nextW = naturalSize.width * nextScale;
      const nextH = naturalSize.height * nextScale;
      setPan((prevPan) => clampPan(prevPan.x, prevPan.y, nextW, nextH));
      return nextZoom;
    });
  }

  async function handleConfirm() {
    if (!imageUri || !naturalSize) return;
    setSaving(true);
    try {
      const cropWidth = frameWidth / displayedScale;
      const cropHeight = frameHeight / displayedScale;
      const cropX = (displayedWidth - frameWidth) / 2 / displayedScale - pan.x / displayedScale;
      const cropY = (displayedHeight - frameHeight) / 2 / displayedScale - pan.y / displayedScale;

      const originX = Math.min(Math.max(0, cropX), Math.max(0, naturalSize.width - cropWidth));
      const originY = Math.min(Math.max(0, cropY), Math.max(0, naturalSize.height - cropHeight));
      const finalCropWidth = Math.min(cropWidth, naturalSize.width);

      // Limitamos el ancho final a 1280px: una foto de cámara sin redimensionar
      // (varios MB) podía tardar tanto en convertirse a blob y subirse que la
      // subida quedaba colgada o fallaba, tanto para la foto de perfil como
      // para la del sello.
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width: finalCropWidth,
              height: Math.min(cropHeight, naturalSize.height),
            },
          },
          { resize: { width: Math.min(1280, Math.round(finalCropWidth)) } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const persisted = await persistPhoto(result.uri);
      if (!persisted.uploaded) {
        Alert.alert(
          'No se pudo subir la foto',
          'Se va a mostrar en tu equipo por ahora, pero puede no verse en el otro dispositivo. Revisá tu conexión y probá de nuevo.'
        );
      }
      onConfirm(persisted.uri);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Ajustá la foto</Text>
          <Text style={styles.subtitle}>Arrastrá para mover y usá +/− para acercar</Text>

          <View
            testID="crop-frame"
            style={[styles.frame, { width: frameWidth, height: frameHeight }]}
            {...panResponder.panHandlers}
          >
            {imageUri && naturalSize && (
              <Image
                source={{ uri: imageUri }}
                style={{
                  position: 'absolute',
                  width: displayedWidth,
                  height: displayedHeight,
                  left: (frameWidth - displayedWidth) / 2 + pan.x,
                  top: (frameHeight - displayedHeight) / 2 + pan.y,
                }}
              />
            )}
            {shape === 'circle' && (
              <View pointerEvents="none" style={[styles.circleMask, { borderRadius: frameWidth / 2 }]} />
            )}
          </View>

          <View style={styles.zoomRow}>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => changeZoom(-0.25)}
              disabled={zoom <= MIN_ZOOM}
            >
              <Text style={styles.zoomButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.zoomLabel}>Zoom</Text>
            <TouchableOpacity
              style={styles.zoomButton}
              onPress={() => changeZoom(0.25)}
              disabled={zoom >= MAX_ZOOM}
            >
              <Text style={styles.zoomButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={saving || !naturalSize}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Guardando...' : 'Listo'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  frame: {
    backgroundColor: '#00000022',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radius.md,
  },
  circleMask: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 3,
    borderColor: colors.gold,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  zoomLabel: {
    color: colors.inkMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
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
    opacity: 0.6,
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
