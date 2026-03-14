import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/BudgetContext';
import { analyzeFrame, AnalyzeResponse, setApiBaseUrl, detectGesture } from '@/services/api';
import { getApiUrl } from '@/services/storage';
import Reticle from '@/components/Reticle';
import ScanningBar from '@/components/ScanningBar';
import BudgetTicker from '@/components/BudgetTicker';
import DecisionOverlay from '@/components/DecisionOverlay';
import { Colors, Fonts, Radii, superellipse } from '@/constants/theme';

const PALM_HOLD_DURATION = 1200;
const PALM_CHECK_INTERVAL = 100;
const GESTURE_POLL_MS = 300;

export default function HudScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { profile, deductFromBalance } = useBudget();
  const router = useRouter();

  const [palmDetected, setPalmDetected] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const palmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const palmStartRef = useRef<number>(0);
  const gestureActiveRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!cameraRef.current || !profile) return;
    setScanning(true);
    setPalmDetected(false);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      if (!photo?.base64) throw new Error('Failed to capture frame');

      const response = await analyzeFrame(photo.base64, profile);
      setResult(response);

      if (response.audioUrl) {
        const { sound } = await Audio.Sound.createAsync({ uri: response.audioUrl });
        await sound.playAsync();
      }
    } catch (err: any) {
      Alert.alert('scan failed', err.message || 'Could not analyze the frame.');
    } finally {
      setScanning(false);
      setScanProgress(0);
      gestureActiveRef.current = false;
    }
  }, [profile]);

  const handleDismiss = useCallback(() => {
    if (result && result.canAfford) {
      deductFromBalance(result.estimatedPrice);
    }
    gestureActiveRef.current = false;
    setResult(null);
  }, [result, deductFromBalance]);

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      if (!cameraRef.current || scanning || result || gestureActiveRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.1,
          skipProcessing: true,
        });
        if (!photo?.base64) return;

        // #region agent log
        fetch('http://127.0.0.1:7372/ingest/f5f8c5bd-217f-4878-839d-5d3ac34bab0e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8110b2'},body:JSON.stringify({sessionId:'8110b2',location:'hud/index.tsx:poll',message:'gesture_poll_fire',data:{hasPhoto:!!photo.base64,photoLen:photo.base64?.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion

        const { palm_open } = await detectGesture(photo.base64);

        // #region agent log
        fetch('http://127.0.0.1:7372/ingest/f5f8c5bd-217f-4878-839d-5d3ac34bab0e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8110b2'},body:JSON.stringify({sessionId:'8110b2',location:'hud/index.tsx:poll',message:'gesture_response',data:{palm_open},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion

        if (palm_open && !gestureActiveRef.current) {
          gestureActiveRef.current = true;
          simulatePalmStart();
        }
      } catch (e: any) {
        // #region agent log
        fetch('http://127.0.0.1:7372/ingest/f5f8c5bd-217f-4878-839d-5d3ac34bab0e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8110b2'},body:JSON.stringify({sessionId:'8110b2',location:'hud/index.tsx:poll',message:'gesture_poll_error',data:{error:e?.message ?? String(e)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      }
    }, GESTURE_POLL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [scanning, result, simulatePalmStart]);

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

        {/* Profile button — top-left, above touch overlay */}
        <Pressable
          style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
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
          />
        )}

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
    top: 16,
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
