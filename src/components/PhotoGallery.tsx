import React, { useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

type Photo = { id: string; url: string };

type Props = {
  photos: Photo[];
  // Si se pasa, cada foto muestra un botón para quitarla (si canRemove la permite).
  onRemove?: (photo: Photo) => void;
  canRemove?: (photo: Photo) => boolean;
};

// Galería que se recorre deslizando de a una foto. Va dentro de pantallas sin
// otro deslizamiento horizontal alrededor, así que el scroll nativo alcanza.
export function PhotoGallery({ photos, onRemove, canRemove }: Props) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const current = Math.min(index, Math.max(0, photos.length - 1));

  function handleLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width === 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(photos.length - 1, next)));
  }

  function goTo(target: number) {
    const clamped = Math.max(0, Math.min(photos.length - 1, target));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setIndex(clamped);
  }

  if (photos.length === 0) return null;

  return (
    <View style={styles.frame} onLayout={handleLayout}>
      {width > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={{ width }}>
              <Image source={{ uri: photo.url }} style={styles.photo} />
              {onRemove && (!canRemove || canRemove(photo)) && (
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => onRemove(photo)}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar esta foto"
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {photos.length > 1 && (
        <>
          {current > 0 && (
            <TouchableOpacity
              style={[styles.arrow, styles.arrowLeft]}
              onPress={() => goTo(current - 1)}
              accessibilityRole="button"
              accessibilityLabel="Foto anterior"
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
          )}
          {current < photos.length - 1 && (
            <TouchableOpacity
              style={[styles.arrow, styles.arrowRight]}
              onPress={() => goTo(current + 1)}
              accessibilityRole="button"
              accessibilityLabel="Foto siguiente"
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          )}
          <View style={styles.counter} pointerEvents="none">
            <Text style={styles.counterText}>
              {current + 1} / {photos.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  removeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: spacing.sm },
  arrowRight: { right: spacing.sm },
  arrowText: { color: colors.white, fontSize: 24, fontWeight: '700', marginTop: -2 },
  counter: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.overlay,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  counterText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
