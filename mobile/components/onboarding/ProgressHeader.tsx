import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  step: number;
  totalSteps: number;
  onBack?: () => void;
}

export default function ProgressHeader({ step, totalSteps, onBack }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(350)}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'\u2190'}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.counter}>
          {String(step).padStart(2, '0')}/{String(totalSteps).padStart(2, '0')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
    ...superellipse(Radii.sm),
  },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  counter: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  track: {
    height: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.md,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.white,
  },
});
