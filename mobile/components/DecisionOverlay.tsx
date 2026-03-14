import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import type { AnalyzeResponse } from '@/services/api';

interface Props {
  result: AnalyzeResponse;
  onDismiss: () => void;
}

export default function DecisionOverlay({ result, onDismiss }: Props) {
  const isAffordable = result.canAfford;
  const color = result.severity === 'green'
    ? Colors.green
    : result.severity === 'yellow'
    ? Colors.yellow
    : Colors.red;
  const bgColor = result.severity === 'green'
    ? Colors.greenDim
    : result.severity === 'yellow'
    ? 'rgba(255, 214, 0, 0.12)'
    : Colors.redDim;
  const icon = isAffordable ? 'checkmark-circle' : 'warning';
  const verdict = isAffordable ? 'AFFORDABLE' : 'OVER BUDGET';

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.backdrop}>
      <Pressable style={styles.dismissArea} onPress={onDismiss} />
      <Animated.View entering={SlideInDown.duration(400).springify()} style={[styles.card, { borderColor: color }]}>
        {/* Verdict Badge */}
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
          <Ionicons name={icon as any} size={18} color={color} />
          <Text style={[styles.badgeText, { color }]}>{verdict}</Text>
        </View>

        {/* Item Info */}
        <Text style={styles.itemName}>{result.item}</Text>
        <Text style={[styles.price, { color }]}>${result.estimatedPrice.toFixed(2)}</Text>

        {/* Voice Line */}
        <View style={styles.voiceWrap}>
          <Ionicons name="chatbubble-ellipses" size={16} color={Colors.accent} />
          <Text style={styles.voiceLine}>"{result.voiceLine}"</Text>
        </View>

        {/* Remaining Balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Remaining after purchase</Text>
          <Text style={[styles.balanceValue, { color: result.fundsRemaining >= 0 ? Colors.green : Colors.red }]}>
            ${result.fundsRemaining.toFixed(2)}
          </Text>
        </View>

        <Pressable style={[styles.dismissBtn, { backgroundColor: bgColor }]} onPress={onDismiss}>
          <Text style={[styles.dismissText, { color }]}>Dismiss</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: 50,
    gap: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  itemName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  price: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  voiceWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.accentDim,
    padding: Spacing.md,
    borderRadius: 12,
  },
  voiceLine: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  dismissText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
