import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

interface Props {
  label: string;
  helper: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export default function CurrencyInputField({
  label,
  helper,
  value,
  onChangeText,
  placeholder,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.dollar}>$</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9.]/g, '');
            onChangeText(cleaned);
          }}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.accent}
          keyboardAppearance="dark"
        />
        <Text style={styles.suffix}>/mo</Text>
      </View>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.xs,
    ...superellipse(Radii.md),
  },
  dollar: {
    fontFamily: Fonts.mono,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    padding: 0,
  },
  suffix: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.textMuted,
  },
  helper: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
});
