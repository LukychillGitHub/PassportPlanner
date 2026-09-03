import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PageFlipper, { PageFlipperInstance } from 'react-native-page-flipper';
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
  const flipperRef = useRef<PageFlipperInstance>(null);
  const readyRef = useRef(false);
  const pendingIndexRef = useRef<number | null>(null);

  const data = useMemo(() => activities.map((a) => a.id), [activities]);

  function handleLayout(event: LayoutChangeEvent) {
    setFrameWidth(event.nativeEvent.layout.width);
    setFrameHeight(event.nativeEvent.layout.height);
  }

  const goToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, activities.length - 1));
    flipperRef.current?.goToPage(clamped);
    setCurrentIndex(clamped);
  }, [activities.length]);

  const handleInitialized = useCallback(() => {
    readyRef.current = true;
    if (pendingIndexRef.current !== null) {
      const target = pendingIndexRef.current;
      pendingIndexRef.current = null;
      goToIndex(target);
    } else {
      setCurrentIndex(0);
    }
  }, [goToIndex]);

  useImperativeHandle(ref, () => ({
    scrollToIndex(index: number) {
      if (!readyRef.current) {
        pendingIndexRef.current = index;
        return;
      }
      goToIndex(index);
    },
  }));

  function goToPage(delta: number) {
    if (delta > 0) {
      flipperRef.current?.nextPage();
    } else {
      flipperRef.current?.previousPage();
    }
  }

  const renderPage = useCallback(
    (activityId: string) => {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) return <View style={styles.emptyPage} />;
      return (
        <PassportPage
          activity={activity}
          stamp={getStamp(activity.id)}
          isAdmin={isAdmin}
          onSealPress={() => onSealPress(activity)}
          onEditPress={() => onEditPress(activity)}
        />
      );
    },
    [activities, getStamp, isAdmin, onSealPress, onEditPress]
  );

  const showDots = activities.length > 1 && activities.length <= MAX_DOTS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cover} onLayout={handleLayout}>
        {frameWidth > 0 && frameHeight > 0 && activities.length > 0 && (
          <PageFlipper
            ref={flipperRef}
            data={data}
            portrait
            singleImageMode
            enabled={activities.length > 1}
            pressable={false}
            pageSize={{ width: frameWidth, height: frameHeight }}
            contentContainerStyle={styles.flipperContent}
            renderPage={renderPage}
            onFlippedEnd={(index: number) => setCurrentIndex(index)}
            onInitialized={handleInitialized}
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
  flipperContent: {
    backgroundColor: colors.card,
  },
  emptyPage: {
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
