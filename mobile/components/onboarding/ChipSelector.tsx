import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  maxSelect?: number;
}

export default function ChipSelector({ options, selected, onToggle, maxSelect }: Props) {
  const atLimit = maxSelect != null && selected.length >= maxSelect;

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        const disabled = atLimit && !isSelected;

        return (
          <Pressable
            key={option}
            onPress={() => {
              if (disabled) return;
              onToggle(option);
            }}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
              disabled && styles.chipDisabled,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
                disabled && styles.chipTextDisabled,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.bgCard,
    ...superellipse(Radii.pill),
  },
  chipSelected: {
    borderColor: Colors.white,
    backgroundColor: Colors.bgElevated,
  },
  chipDisabled: {
    opacity: 0.3,
  },
  chipText: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  chipTextDisabled: {
    color: Colors.textMuted,
  },
});
