import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const BRACKET_LEN = 25;

interface Props {
  scanning: boolean;
}

export default function Reticle({ scanning }: Props) {
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(scanning ? 1.15 : 1.05, {
        duration: scanning ? 600 : 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(scanning ? 1 : 0.6, {
        duration: scanning ? 600 : 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [scanning, pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: opacity.value,
  }));

  const color = scanning ? Colors.green : Colors.accent;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.svgWrap, animatedStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Outer pulsing circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
            opacity={0.4}
          />

          {/* Inner circle */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * 0.4}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={0.6}
          />

          {/* Center dot */}
          <Circle cx={CENTER} cy={CENTER} r={3} fill={color} />

          {/* Crosshairs */}
          <G opacity={0.5}>
            <Line
              x1={CENTER}
              y1={CENTER - RADIUS + 15}
              x2={CENTER}
              y2={CENTER - RADIUS + 30}
              stroke={color}
              strokeWidth={1}
            />
            <Line
              x1={CENTER}
              y1={CENTER + RADIUS - 30}
              x2={CENTER}
              y2={CENTER + RADIUS - 15}
              stroke={color}
              strokeWidth={1}
            />
            <Line
              x1={CENTER - RADIUS + 15}
              y1={CENTER}
              x2={CENTER - RADIUS + 30}
              y2={CENTER}
              stroke={color}
              strokeWidth={1}
            />
            <Line
              x1={CENTER + RADIUS - 30}
              y1={CENTER}
              x2={CENTER + RADIUS - 15}
              y2={CENTER}
              stroke={color}
              strokeWidth={1}
            />
          </G>

          {/* Corner brackets */}
          {/* Top-left */}
          <Line x1={10} y1={10} x2={10 + BRACKET_LEN} y2={10} stroke={color} strokeWidth={2.5} />
          <Line x1={10} y1={10} x2={10} y2={10 + BRACKET_LEN} stroke={color} strokeWidth={2.5} />

          {/* Top-right */}
          <Line
            x1={SIZE - 10}
            y1={10}
            x2={SIZE - 10 - BRACKET_LEN}
            y2={10}
            stroke={color}
            strokeWidth={2.5}
          />
          <Line
            x1={SIZE - 10}
            y1={10}
            x2={SIZE - 10}
            y2={10 + BRACKET_LEN}
            stroke={color}
            strokeWidth={2.5}
          />

          {/* Bottom-left */}
          <Line
            x1={10}
            y1={SIZE - 10}
            x2={10 + BRACKET_LEN}
            y2={SIZE - 10}
            stroke={color}
            strokeWidth={2.5}
          />
          <Line
            x1={10}
            y1={SIZE - 10}
            x2={10}
            y2={SIZE - 10 - BRACKET_LEN}
            stroke={color}
            strokeWidth={2.5}
          />

          {/* Bottom-right */}
          <Line
            x1={SIZE - 10}
            y1={SIZE - 10}
            x2={SIZE - 10 - BRACKET_LEN}
            y2={SIZE - 10}
            stroke={color}
            strokeWidth={2.5}
          />
          <Line
            x1={SIZE - 10}
            y1={SIZE - 10}
            x2={SIZE - 10}
            y2={SIZE - 10 - BRACKET_LEN}
            stroke={color}
            strokeWidth={2.5}
          />
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
