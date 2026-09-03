import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { Activity } from '../types';
import { colors, wheelPalette } from '../theme';

export type WheelHandle = {
  spin: () => void;
};

type Props = {
  activities: Activity[];
  size?: number;
  onSpinStart: () => void;
  onSpinEnd: (activity: Activity) => void;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const SPIN_ROUNDS = 5;
const SPIN_DURATION_MS = 3800;
const POINTER_ANGLE = -90; // 12 o'clock, medido igual que los ángulos de los sectores

export const Wheel = forwardRef<WheelHandle, Props>(function Wheel(
  { activities, size = 300, onSpinStart, onSpinEnd },
  ref
) {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentDegRef = useRef(0);

  useImperativeHandle(ref, () => ({
    spin() {
      if (activities.length === 0) return;

      const winnerIndex = Math.floor(Math.random() * activities.length);
      const sliceAngle = 360 / activities.length;
      const winnerMidAngle = winnerIndex * sliceAngle + sliceAngle / 2;

      let neededMod = (POINTER_ANGLE - winnerMidAngle) % 360;
      if (neededMod < 0) neededMod += 360;

      const current = currentDegRef.current;
      const currentMod = ((current % 360) + 360) % 360;
      let delta = neededMod - currentMod;
      if (delta <= 0) delta += 360;

      const target = current + delta + SPIN_ROUNDS * 360;

      onSpinStart();
      Animated.timing(rotation, {
        toValue: target,
        duration: SPIN_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        currentDegRef.current = target;
        onSpinEnd(activities[winnerIndex]);
      });
    },
  }));

  const spinDeg = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const radius = size / 2;
  const cx = radius;
  const cy = radius;
  const sliceAngle = activities.length > 0 ? 360 / activities.length : 360;

  return (
    <View style={[styles.wrapper, { width: size, height: size + 24 }]}>
      <View style={styles.pointer} />
      <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={cx} cy={cy} r={radius - 2} fill={colors.card} stroke={colors.gold} strokeWidth={4} />
          {activities.map((activity, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;
            const textPos = polarToCartesian(cx, cy, radius * 0.62, midAngle);
            const color = wheelPalette[index % wheelPalette.length];
            let labelRotation = (midAngle + 90) % 360;
            if (labelRotation > 90 && labelRotation < 270) labelRotation -= 180;
            return (
              <React.Fragment key={activity.id}>
                <Path
                  d={describeSlice(cx, cy, radius - 6, startAngle, endAngle)}
                  fill={color}
                  stroke={colors.card}
                  strokeWidth={2}
                />
                <SvgText
                  x={textPos.x}
                  y={textPos.y}
                  fill={colors.white}
                  fontSize={Math.max(10, size / 26)}
                  fontWeight="700"
                  textAnchor="middle"
                  transform={`rotate(${labelRotation}, ${textPos.x}, ${textPos.y})`}
                >
                  {truncate(activity.title, 16)}
                </SvgText>
              </React.Fragment>
            );
          })}
          <Circle cx={cx} cy={cy} r={size * 0.07} fill={colors.primaryDark} stroke={colors.gold} strokeWidth={3} />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pointer: {
    position: 'absolute',
    top: 6,
    zIndex: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.accent,
  },
});
