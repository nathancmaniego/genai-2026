import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  labels: string[];
  selected: number | null;
  onSelect: (index: number) => void;
}

export default function ScaleSelector({ labels, selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {labels.map((label, i) => {
        const isSelected = selected === i;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={[styles.pill, isSelected && styles.pillSelected]}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: Colors.bgElevated,
    ...superellipse(Radii.sm),
  },
  pillSelected: {
    backgroundColor: Colors.white,
  },
  pillText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  pillTextSelected: {
    color: Colors.bg,
    fontWeight: '700',
  },
});
