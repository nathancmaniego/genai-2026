import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { Colors, Fonts, Spacing, Radii, superellipse } from '@/constants/theme';

const AUTO_DISMISS_MS = 12000;
const CONFIRM_COUNTDOWN_MS = 10000;
const COUNTDOWN_TICK_MS = 50;

function formatScanText(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/^Here's the analysis:\s*\n?/i, '')
    .trim();
}

const RATING_BORDER = {
  bad: Colors.red,
  okay: '#E6B800',
  good: Colors.green,
} as const;

interface Props {
  text: string;
  price: number | null;
  rating: 'bad' | 'okay' | 'good';
  onConfirm: (price: number) => void;
  onDismiss: () => void;
}

export default function ScanResultOverlay({ text, price, rating = 'okay', onConfirm, onDismiss }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const formatted = formatScanText(text);
  const hasPrice = price != null;
  const borderColor = RATING_BORDER[rating];
  const cardBorderStyle = { borderColor, borderWidth: 2 };

  const [countdownLeft, setCountdownLeft] = useState(hasPrice ? CONFIRM_COUNTDOWN_MS : 0);

  // #region agent log
  fetch('http://127.0.0.1:7384/ingest/5d9625a9-e8b7-4570-ae8d-a065c26734cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'74243f'},body:JSON.stringify({sessionId:'74243f',location:'ScanResultOverlay.tsx:mount',message:'ScanResultOverlay mounted',data:{hasPrice,price,countdownLeft:hasPrice?CONFIRM_COUNTDOWN_MS:0},timestamp:Date.now(),hypothesisId:'A,B,D'})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    if (!hasPrice) {
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/5d9625a9-e8b7-4570-ae8d-a065c26734cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'74243f'},body:JSON.stringify({sessionId:'74243f',location:'ScanResultOverlay.tsx:effect1-noprice',message:'No price - setting auto dismiss timeout',data:{hasPrice},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }
    setCountdownLeft(CONFIRM_COUNTDOWN_MS);
  }, [onDismiss, hasPrice]);

  useEffect(() => {
    if (!hasPrice) return;
    // #region agent log
    fetch('http://127.0.0.1:7384/ingest/5d9625a9-e8b7-4570-ae8d-a065c26734cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'74243f'},body:JSON.stringify({sessionId:'74243f',location:'ScanResultOverlay.tsx:effect2-start',message:'Starting countdown interval',data:{hasPrice},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const t = setInterval(() => {
      setCountdownLeft((prev) => {
        const next = prev - COUNTDOWN_TICK_MS;
        if (next <= 0) {
          clearInterval(t);
          return 0;
        }
        return next;
      });
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(t);
  }, [hasPrice]);

  useEffect(() => {
    if (hasPrice && countdownLeft <= 0) {
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/5d9625a9-e8b7-4570-ae8d-a065c26734cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'74243f'},body:JSON.stringify({sessionId:'74243f',location:'ScanResultOverlay.tsx:countdown-dismiss-effect',message:'Countdown hit 0 - calling onDismiss from useEffect (safe)',data:{countdownLeft,hasPrice},timestamp:Date.now(),hypothesisId:'A-fix'})}).catch(()=>{});
      // #endregion
      onDismiss();
    }
  }, [countdownLeft, hasPrice, onDismiss]);

  const countdownProgress = hasPrice ? countdownLeft / CONFIRM_COUNTDOWN_MS : 1;

  const lsBody = isLandscape ? { fontSize: 11, lineHeight: 17 } : undefined;
  const lsConfirm = isLandscape ? { fontSize: 10, paddingVertical: 8 } : undefined;
  const lsInner = isLandscape ? { padding: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.xs } : undefined;

  const cardContent = (
    <>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: borderColor }]} />
        <Text style={[styles.label, { color: borderColor }]}>SCAN</Text>
      </View>

      <Text style={[styles.body, lsBody]}>{formatted}</Text>

      {hasPrice ? (
        <>
          <View style={styles.confirmBar}>
            <Pressable
              style={({ pressed }) => [styles.confirmBtnFull, lsConfirm, pressed && styles.confirmBtnPressed]}
              onPress={() => onConfirm(price)}
            >
              <Text style={[styles.confirmText, isLandscape && { fontSize: 9 }]}>confirm · ${price.toFixed(2)}</Text>
            </Pressable>
            <View style={styles.countdownTrack}>
              <View
                style={[styles.countdownFill, { width: `${countdownProgress * 100}%` }]}
              />
            </View>
          </View>
          <Text style={styles.gestureHint}>thumbs up to confirm or press confirm</Text>
        </>
      ) : (
        <Text style={styles.tapHint}>tap to dismiss · auto-closes in 12s</Text>
      )}
    </>
  );

  const wrapperStyle = isLandscape
    ? [styles.wrapper, styles.wrapperLandscape, { left: width * 0.55 }]
    : styles.wrapper;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={wrapperStyle}
      pointerEvents="box-none"
    >
      <Animated.View
        entering={SlideInRight.duration(300).springify()}
        style={styles.card}
      >
        {hasPrice ? (
          <View style={[styles.cardInner, cardBorderStyle, lsInner]}>{cardContent}</View>
        ) : (
          <Pressable style={[styles.cardInner, cardBorderStyle, lsInner]} onPress={onDismiss}>
            {cardContent}
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Spacing.xl + 40,
    right: Spacing.lg,
    left: Spacing.xl,
    alignItems: 'stretch',
    zIndex: 100,
  },
  wrapperLandscape: {
    bottom: 70,
    top: Spacing.lg,
    right: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    ...superellipse(Radii.lg),
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(92, 224, 210, 0.25)',
    ...superellipse(Radii.lg),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  tapHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  gestureHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  confirmBar: {
    width: '100%',
    marginTop: Spacing.xs,
    gap: 0,
  },
  confirmBtnFull: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(92, 224, 210, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(92, 224, 210, 0.4)',
    borderTopLeftRadius: Radii.sm,
    borderTopRightRadius: Radii.sm,
  },
  confirmBtnPressed: {
    backgroundColor: 'rgba(92, 224, 210, 0.3)',
  },
  confirmText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1,
  },
  countdownTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: Radii.sm,
    borderBottomRightRadius: Radii.sm,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 0,
  },
});
