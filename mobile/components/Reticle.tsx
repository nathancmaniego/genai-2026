import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

const SIZE = 220;
const CENTER = SIZE / 2;
const BRACKET = 40;
const INSET = 20;
const CORNER_R = 6;

interface Props {
  scanning: boolean;
}

export default function Reticle({ scanning }: Props) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(scanning ? 1 : 0.65, {
        duration: scanning ? 500 : 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scanning, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const c = scanning ? Colors.accent : Colors.white;
  const w = scanning ? 2 : 1.5;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.svgWrap, animatedStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Superellipse-style rounded rect outline */}
          <Rect
            x={INSET}
            y={INSET}
            width={SIZE - INSET * 2}
            height={SIZE - INSET * 2}
            rx={CORNER_R * 3}
            ry={CORNER_R * 3}
            stroke={c}
            strokeWidth={0.5}
            fill="none"
            opacity={0.2}
          />

          {/* Center crosshair - minimal */}
          <Circle cx={CENTER} cy={CENTER} r={2} fill={c} opacity={0.8} />
          <Line x1={CENTER - 8} y1={CENTER} x2={CENTER - 3} y2={CENTER} stroke={c} strokeWidth={w} opacity={0.6} />
          <Line x1={CENTER + 3} y1={CENTER} x2={CENTER + 8} y2={CENTER} stroke={c} strokeWidth={w} opacity={0.6} />
          <Line x1={CENTER} y1={CENTER - 8} x2={CENTER} y2={CENTER - 3} stroke={c} strokeWidth={w} opacity={0.6} />
          <Line x1={CENTER} y1={CENTER + 3} x2={CENTER} y2={CENTER + 8} stroke={c} strokeWidth={w} opacity={0.6} />

          {/* Corner brackets — clean L shapes */}
          {/* Top-left */}
          <Line x1={INSET} y1={INSET} x2={INSET + BRACKET} y2={INSET} stroke={c} strokeWidth={w} />
          <Line x1={INSET} y1={INSET} x2={INSET} y2={INSET + BRACKET} stroke={c} strokeWidth={w} />

          {/* Top-right */}
          <Line x1={SIZE - INSET} y1={INSET} x2={SIZE - INSET - BRACKET} y2={INSET} stroke={c} strokeWidth={w} />
          <Line x1={SIZE - INSET} y1={INSET} x2={SIZE - INSET} y2={INSET + BRACKET} stroke={c} strokeWidth={w} />

          {/* Bottom-left */}
          <Line x1={INSET} y1={SIZE - INSET} x2={INSET + BRACKET} y2={SIZE - INSET} stroke={c} strokeWidth={w} />
          <Line x1={INSET} y1={SIZE - INSET} x2={INSET} y2={SIZE - INSET - BRACKET} stroke={c} strokeWidth={w} />

          {/* Bottom-right */}
          <Line x1={SIZE - INSET} y1={SIZE - INSET} x2={SIZE - INSET - BRACKET} y2={SIZE - INSET} stroke={c} strokeWidth={w} />
          <Line x1={SIZE - INSET} y1={SIZE - INSET} x2={SIZE - INSET} y2={SIZE - INSET - BRACKET} stroke={c} strokeWidth={w} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrap: {
    width: SIZE,
    height: SIZE,
  },
});
