import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Activity, Stamp } from '../types';
import { colors, radius, spacing } from '../theme';
import { PassportPage } from './PassportPage';

export type PassportBookHandle = {
  scrollToIndex: (index: number) => void;
};

type Props = {
  activities: Activity[];
  getStamp: (activityId: string) => Stamp | undefined;
  isAdmin: boolean;
  onSealPress: (activity: Activity) => void;
  onEditPress: (activity: Activity) => void;
};

const MAX_DOTS = 10;

export const PassportBook = forwardRef<PassportBookHandle, Props>(function PassportBook(
  { activities, getStamp, isAdmin, onSealPress, onEditPress },
  ref
) {
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<Activity>>(null);
  const pendingIndexRef = useRef<number | null>(null);

  function handleLayout(event: LayoutChangeEvent) {
    setFrameWidth(event.nativeEvent.layout.width);
    setFrameHeight(event.nativeEvent.layout.height);
  }

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, activities.length - 1));
      if (frameWidth === 0) {
        // El FlatList todavía no midió su ancho; guardamos el índice pedido
        // y lo aplicamos apenas se conozca (ver el useEffect de abajo, vía
        // el chequeo en cada re-render con onLayout ya disparado).
        pendingIndexRef.current = clamped;
        return;
      }
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setCurrentIndex(clamped);
    },
    [activities.length, frameWidth]
  );

  useImperativeHandle(ref, () => ({
    scrollToIndex(index: number) {
      goToIndex(index);
    },
  }));

  // Si se pidió un salto antes de que el FlatList tuviera su ancho medido,
  // lo aplicamos apenas frameWidth deja de ser 0.
  React.useEffect(() => {
    if (frameWidth > 0 && pendingIndexRef.current !== null) {
      const target = pendingIndexRef.current;
      pendingIndexRef.current = null;
      goToIndex(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameWidth]);

  function goToPage(delta: number) {
    goToIndex(currentIndex + delta);
  }

  // Se usa tanto durante el arrastre (onScroll, throttled) como al terminarlo
  // (onMomentumScrollEnd / onScrollEndDrag) para que el contador de página y
  // los puntitos nunca queden desincronizados, sin importar si el gesto
  // termina con impulso (fling) o con un arrastre lento y suelto.
  function handleScrollUpdate(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (frameWidth === 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / frameWidth);
    const clamped = Math.max(0, Math.min(index, activities.length - 1));
    setCurrentIndex((prev) => (prev === clamped ? prev : clamped));
  }

  const renderItem = useCallback(
    ({ item: activity }: { item: Activity }) => (
      <View style={{ width: frameWidth, height: frameHeight }}>
        <PassportPage
          activity={activity}
          stamp={getStamp(activity.id)}
          isAdmin={isAdmin}
          onSealPress={() => onSealPress(activity)}
          onEditPress={() => onEditPress(activity)}
        />
      </View>
    ),
    [frameWidth, frameHeight, getStamp, isAdmin, onSealPress, onEditPress]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: frameWidth,
      offset: frameWidth * index,
      index,
    }),
    [frameWidth]
  );

  const showDots = activities.length > 1 && activities.length <= MAX_DOTS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cover} onLayout={handleLayout}>
        {frameWidth > 0 && frameHeight > 0 && activities.length > 0 && (
          <FlatList
            ref={listRef}
            data={activities}
            keyExtractor={(activity) => activity.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={activities.length > 1}
            getItemLayout={getItemLayout}
            onScroll={handleScrollUpdate}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleScrollUpdate}
            onScrollEndDrag={handleScrollUpdate}
            style={styles.list}
          />
        )}

        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={() => goToPage(-1)}
            accessibilityRole="button"
            accessibilityLabel="Página anterior"
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
        )}
        {currentIndex < activities.length - 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={() => goToPage(1)}
            accessibilityRole="button"
            accessibilityLabel="Página siguiente"
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        {showDots && (
          <View style={styles.dotsRow}>
            {activities.map((activity, index) => (
              <View key={activity.id} style={[styles.dot, index === currentIndex && styles.dotActive]} />
            ))}
          </View>
        )}
        <Text style={styles.pageCounter}>
          Página {activities.length === 0 ? 0 : currentIndex + 1} de {activities.length}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  cover: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
    backgroundColor: colors.card,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 36,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20000,
  },
  navButtonLeft: {
    left: 2,
  },
  navButtonRight: {
    right: 2,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  pageCounter: {
    fontSize: 12,
    color: colors.inkMuted,
    fontWeight: '600',
  },
});
