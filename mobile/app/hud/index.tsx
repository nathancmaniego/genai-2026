import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBudget } from '@/context/BudgetContext';
import { analyzeFrame, AnalyzeResponse, ScanResponse, setApiBaseUrl, detectGesture, scanImage } from '@/services/api';
import { getApiUrl, getUserProfile } from '@/services/storage';
import Reticle from '@/components/Reticle';
import ScanningBar from '@/components/ScanningBar';
import BudgetTicker from '@/components/BudgetTicker';
import DecisionOverlay from '@/components/DecisionOverlay';
import ScanResultOverlay from '@/components/ScanResultOverlay';
import { Colors, Fonts, Radii, superellipse } from '@/constants/theme';

const PALM_HOLD_DURATION = 1200;
const PALM_CHECK_INTERVAL = 100;
const GESTURE_POLL_MS = 1500;

export default function HudScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { profile, deductFromBalance, deductFromDiscretionary } = useBudget();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [palmDetected, setPalmDetected] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);

  const palmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const palmStartRef = useRef<number>(0);
  const gestureActiveRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanResultRef = useRef<ScanResponse | null>(null);
  scanResultRef.current = scanResult;

  useEffect(() => {
    getApiUrl().then((url) => {
      if (url) setApiBaseUrl(url);
    });
  }, []);

  const simulatePalmStart = useCallback(() => {
    if (scanning || result) return;
    setPalmDetected(true);
    palmStartRef.current = Date.now();

    palmTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - palmStartRef.current;
      const progress = Math.min(elapsed / PALM_HOLD_DURATION, 1);
      setScanProgress(progress);

      if (progress >= 1) {
        if (palmTimerRef.current) clearInterval(palmTimerRef.current);
        triggerScan();
      }
    }, PALM_CHECK_INTERVAL);
  }, [scanning, result]);

  const simulatePalmEnd = useCallback(() => {
    setPalmDetected(false);
    setScanProgress(0);
    if (palmTimerRef.current) {
      clearInterval(palmTimerRef.current);
      palmTimerRef.current = null;
    }
  }, []);

  const triggerScan = useCallback(async () => {
    if (!cameraRef.current) return;
    setScanning(true);
    setPalmDetected(false);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) throw new Error('Failed to capture frame');

      const calibration = await getUserProfile();
      const scan = await scanImage(photo.base64, calibration);
      setScanResult(scan);
    } catch (err: any) {
      Alert.alert('scan failed', err.message || 'Could not analyze the frame.');
    } finally {
      setScanning(false);
      setScanProgress(0);
      gestureActiveRef.current = false;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7384/ingest/5d9625a9-e8b7-4570-ae8d-a065c26734cd',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'74243f'},body:JSON.stringify({sessionId:'74243f',location:'index.tsx:handleDismiss',message:'handleDismiss called - about to setScanResult(null)',data:{hasResult:!!result},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (result && result.canAfford) {
      deductFromBalance(result.estimatedPrice);
    }
    gestureActiveRef.current = false;
    setResult(null);
    setScanResult(null);
  }, [result, deductFromBalance]);

  const handleScanConfirm = useCallback((price: number) => {
    if (scanResultRef.current?.purchaseType === 'discretionary') {
      deductFromDiscretionary(price);
    } else {
      deductFromBalance(price);
    }
    gestureActiveRef.current = false;
    setScanResult(null);
  }, [deductFromBalance, deductFromDiscretionary]);

  const thumbsActedRef = useRef(false);

  useEffect(() => {
    thumbsActedRef.current = false;
  }, [scanResult]);

  useFocusEffect(
    useCallback(() => {
      pollingRef.current = setInterval(async () => {
        if (!cameraRef.current || scanning || result) return;

        const awaitingConfirm = scanResultRef.current?.estimatedPrice != null;

        if (!awaitingConfirm && (scanResultRef.current || gestureActiveRef.current)) return;

        try {
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.1,
            skipProcessing: true,
          });
          if (!photo?.base64) return;

          const gesture = await detectGesture(photo.base64);

          if (awaitingConfirm) {
            if (thumbsActedRef.current) return;
            const price = scanResultRef.current!.estimatedPrice!;
            if (gesture.thumbs_up) {
              thumbsActedRef.current = true;
              handleScanConfirm(price);
            }
          } else {
            if (gesture.palm_open && !gestureActiveRef.current) {
              gestureActiveRef.current = true;
              simulatePalmStart();
            }
          }
        } catch {
          // gesture polling is best-effort
        }
      }, GESTURE_POLL_MS);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [scanning, result, simulatePalmStart, handleScanConfirm])
  );

  const handlePalmEnd = useCallback(() => {
    gestureActiveRef.current = false;
    simulatePalmEnd();
  }, [simulatePalmEnd]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          c.h.u.d requires camera access
        </Text>
        <Text style={styles.permissionBtn} onPress={requestPermission}>
          grant access
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View
          style={styles.touchOverlay}
          onTouchStart={simulatePalmStart}
          onTouchEnd={handlePalmEnd}
          onTouchCancel={handlePalmEnd}
        />

        {/* Profile button — below status bar */}
        <Pressable
          style={({ pressed }) => [styles.menuBtn, { top: insets.top + 12 }, pressed && styles.menuBtnPressed]}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.menuText}>c.h.u.d</Text>
        </Pressable>

        <Reticle scanning={palmDetected || scanning} />
        <ScanningBar progress={scanProgress} visible={palmDetected} />

        {scanning && (
          <View style={styles.statusWrap}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>analyzing</Text>
          </View>
        )}

        {profile && (
          <BudgetTicker
            currentBalance={profile.currentBalance}
            dailyBudget={profile.dailyFunBudget}
            discretionaryBalance={profile.discretionaryBalance ?? 0}
            discretionaryBudget={profile.monthlyDiscretionaryBudget ?? 0}
          />
        )}

        {scanResult ? (
          <ScanResultOverlay
            text={scanResult.text}
            price={scanResult.estimatedPrice}
            rating={scanResult.rating}
            purchaseType={scanResult.purchaseType}
            onConfirm={handleScanConfirm}
            onDismiss={handleDismiss}
          />
        ) : null}

        {result && <DecisionOverlay result={result} onDismiss={handleDismiss} />}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...superellipse(Radii.sm),
  },
  menuBtnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 2,
    opacity: 0.7,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    letterSpacing: 0.5,
  },
  permissionBtn: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    padding: 12,
    letterSpacing: 1,
  },
  statusWrap: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 2,
  },
});
