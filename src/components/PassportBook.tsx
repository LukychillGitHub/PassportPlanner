import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
const RUBBER_BAND = 0.35;
const FLING_VELOCITY = 700;

export const PassportBook = forwardRef<PassportBookHandle, Props>(function PassportBook(
  { activities, getStamp, isAdmin, onSealPress, onEditPress },
  ref
) {
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const gestureStartRef = useRef(0);
  const pendingIndexRef = useRef<number | null>(null);

  const maxOffset = Math.max(0, (activities.length - 1) * frameWidth);

  const settleTo = useCallback(
    (targetIndex: number, animated: boolean) => {
      const clamped = Math.max(0, Math.min(targetIndex, activities.length - 1));
      const targetOffset = clamped * frameWidth;
      offsetRef.current = targetOffset;
      setCurrentIndex(clamped);
      if (animated) {
        Animated.spring(scrollX, {
          toValue: targetOffset,
          useNativeDriver: true,
          friction: 10,
          tension: 65,
        }).start();
      } else {
        scrollX.setValue(targetOffset);
      }
    },
    [activities.length, frameWidth, scrollX]
  );

  useEffect(() => {
    if (frameWidth > 0 && pendingIndexRef.current !== null) {
      const target = pendingIndexRef.current;
      pendingIndexRef.current = null;
      settleTo(target, false);
    }
  }, [frameWidth, settleTo]);

  useEffect(() => {
    if (frameWidth > 0 && currentIndex > activities.length - 1) {
      settleTo(activities.length - 1, false);
    }
  }, [activities.length, currentIndex, frameWidth, settleTo]);

  useImperativeHandle(ref, () => ({
    scrollToIndex(index: number) {
      if (!frameWidth) {
        pendingIndexRef.current = index;
        return;
      }
      settleTo(index, true);
    },
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setFrameWidth(event.nativeEvent.layout.width);
    setFrameHeight(event.nativeEvent.layout.height);
  }

  function goToPage(delta: number) {
    settleTo(currentIndex + delta, true);
  }

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(frameWidth > 0 && activities.length > 1)
        .activeOffsetX([-10, 10])
        .failOffsetY([-15, 15])
        .onStart(() => {
          gestureStartRef.current = offsetRef.current;
        })
        .onUpdate((event) => {
          let next = gestureStartRef.current - event.translationX;
          if (next < 0) next = next * RUBBER_BAND;
          if (next > maxOffset) next = maxOffset + (next - maxOffset) * RUBBER_BAND;
          scrollX.setValue(next);
        })
        .onEnd((event) => {
          const startIndex = Math.round(gestureStartRef.current / frameWidth);
          let targetIndex = Math.round((gestureStartRef.current - event.translationX) / frameWidth);
          if (Math.abs(event.velocityX) > FLING_VELOCITY) {
            targetIndex = event.velocityX < 0 ? startIndex + 1 : startIndex - 1;
          }
          settleTo(targetIndex, true);
        }),
    [frameWidth, maxOffset, activities.length, scrollX, settleTo]
  );

  const showDots = activities.length > 1 && activities.length <= MAX_DOTS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cover} onLayout={handleLayout}>
        {frameWidth > 0 && frameHeight > 0 && (
          <GestureDetector gesture={panGesture}>
            <View style={styles.gestureArea}>
              {activities.map((item, index) => (
                <PassportBookPage
                  key={item.id}
                  activity={item}
                  index={index}
                  frameWidth={frameWidth}
                  frameHeight={frameHeight}
                  scrollX={scrollX}
                  stamp={getStamp(item.id)}
                  isAdmin={isAdmin}
                  onSealPress={() => onSealPress(item)}
                  onEditPress={() => onEditPress(item)}
                />
              ))}
            </View>
          </GestureDetector>
        )}

        {currentIndex > 0 && (
          <TouchableOpacity style={[styles.navButton, styles.navButtonLeft]} onPress={() => goToPage(-1)}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
        )}
        {currentIndex < activities.length - 1 && (
          <TouchableOpacity style={[styles.navButton, styles.navButtonRight]} onPress={() => goToPage(1)}>
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

type PageProps = {
  activity: Activity;
  index: number;
  frameWidth: number;
  frameHeight: number;
  scrollX: Animated.Value;
  stamp?: Stamp;
  isAdmin: boolean;
  onSealPress: () => void;
  onEditPress: () => void;
};

function PassportBookPage({
  activity,
  index,
  frameWidth,
  frameHeight,
  scrollX,
  stamp,
  isAdmin,
  onSealPress,
  onEditPress,
}: PageProps) {
  const inputRange = [(index - 1) * frameWidth, index * frameWidth, (index + 1) * frameWidth];
  const translateX = Animated.subtract(index * frameWidth, scrollX);
  const scale = scrollX.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
  const rotateY = scrollX.interpolate({ inputRange, outputRange: ['24deg', '0deg', '-24deg'], extrapolate: 'clamp' });
  const shadowOpacity = scrollX.interpolate({ inputRange, outputRange: [0.35, 0, 0.35], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: frameWidth,
        height: frameHeight,
        transform: [{ perspective: 900 }, { translateX }, { rotateY }, { scale }],
      }}
    >
      <View style={styles.pageSlot}>
        <PassportPage
          activity={activity}
          stamp={stamp}
          isAdmin={isAdmin}
          onSealPress={onSealPress}
          onEditPress={onEditPress}
        />
        <Animated.View pointerEvents="none" style={[styles.pageShade, { opacity: shadowOpacity }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  cover: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  gestureArea: {
    flex: 1,
  },
  pageSlot: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  pageShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    backgroundColor: '#000000',
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
