import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
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
  const listRef = useRef<Animated.FlatList<Activity>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentIndex > activities.length - 1) {
      const next = Math.max(0, activities.length - 1);
      setCurrentIndex(next);
      listRef.current?.scrollToOffset({ offset: next * frameWidth, animated: false });
    }
  }, [activities.length, currentIndex, frameWidth]);

  useImperativeHandle(ref, () => ({
    scrollToIndex(index: number) {
      const clamped = Math.max(0, Math.min(index, activities.length - 1));
      listRef.current?.scrollToOffset({ offset: clamped * frameWidth, animated: true });
      setCurrentIndex(clamped);
    },
  }));

  function handleLayout(event: LayoutChangeEvent) {
    setFrameWidth(event.nativeEvent.layout.width);
    setFrameHeight(event.nativeEvent.layout.height);
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!frameWidth) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / frameWidth);
    setCurrentIndex(index);
  }

  function goToPage(delta: number) {
    const next = Math.max(0, Math.min(currentIndex + delta, activities.length - 1));
    listRef.current?.scrollToOffset({ offset: next * frameWidth, animated: true });
    setCurrentIndex(next);
  }

  const renderItem = useCallback(
    ({ item, index }: { item: Activity; index: number }) => {
      if (!frameWidth) return null;
      const inputRange = [(index - 1) * frameWidth, index * frameWidth, (index + 1) * frameWidth];
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.92, 1, 0.92],
        extrapolate: 'clamp',
      });
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.55, 1, 0.55],
        extrapolate: 'clamp',
      });
      return (
        <Animated.View style={{ width: frameWidth, height: frameHeight, transform: [{ scale }], opacity }}>
          <View style={styles.pageSlot}>
            <PassportPage
              activity={item}
              stamp={getStamp(item.id)}
              isAdmin={isAdmin}
              onSealPress={() => onSealPress(item)}
              onEditPress={() => onEditPress(item)}
            />
          </View>
        </Animated.View>
      );
    },
    [frameWidth, frameHeight, getStamp, isAdmin, onSealPress, onEditPress, scrollX]
  );

  const showDots = activities.length > 1 && activities.length <= MAX_DOTS;

  return (
    <View style={styles.wrapper}>
      <View style={styles.cover} onLayout={handleLayout}>
        {frameWidth > 0 && frameHeight > 0 && (
          <Animated.FlatList
            ref={listRef}
            style={styles.flatList}
            data={activities}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={frameWidth}
            bounces={false}
            getItemLayout={(_, index) => ({ length: frameWidth, offset: frameWidth * index, index })}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumEnd}
          />
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
              <View
                key={activity.id}
                style={[styles.dot, index === currentIndex && styles.dotActive]}
              />
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
  },
  flatList: {
    flex: 1,
  },
  pageSlot: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
