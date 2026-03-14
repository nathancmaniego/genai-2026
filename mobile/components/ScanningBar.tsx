import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  /** 0–1 progress of palm hold detection */
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
          {isComplete ? '✓ SCANNING...' : 'HOLD PALM TO SCAN'}
        </Text>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            barStyle,
            { backgroundColor: isComplete ? Colors.green : Colors.accent },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    right: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  percent: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
