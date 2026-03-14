import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Fonts, Spacing } from '@/constants/theme';

interface Props {
  progress: number;
  visible: boolean;
}

export default function ScanningBar({ progress, visible }: Props) {
  const width = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    containerOpacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, containerOpacity]);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 100,
      easing: Easing.out(Easing.ease),
    });
  }, [progress, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(width.value * 100, 100)}%`,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const isComplete = progress >= 1;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {isComplete ? 'scanning' : 'hold to scan'}
        </Text>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            barStyle,
            { backgroundColor: isComplete ? Colors.accent : Colors.white },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 44,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 2,
    opacity: 0.7,
  },
  percent: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  track: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
