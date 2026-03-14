import { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Audio } from 'expo-av';
import { useBudget } from '@/context/BudgetContext';
import { analyzeFrame, AnalyzeResponse } from '@/services/api';
import Reticle from '@/components/Reticle';
import ScanningBar from '@/components/ScanningBar';
import BudgetTicker from '@/components/BudgetTicker';
import DecisionOverlay from '@/components/DecisionOverlay';
import { Colors } from '@/constants/theme';

const PALM_HOLD_DURATION = 1200;
const PALM_CHECK_INTERVAL = 100;

export default function HudScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { profile, deductFromBalance } = useBudget();

  const [palmDetected, setPalmDetected] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const palmTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const palmStartRef = useRef<number>(0);

  // Lock to landscape on mount
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Simulated palm detection — in production this would be MediaPipe
  // For demo: tap anywhere on camera to simulate palm detection
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
      Alert.alert('Scan Failed', err.message || 'Could not analyze the frame.');
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  }, [profile]);

  const handleDismiss = useCallback(() => {
    if (result && !result.canAfford) {
      // Don't deduct if they can't afford it
    } else if (result) {
      deductFromBalance(result.estimatedPrice);
    }
    setResult(null);
  }, [result, deductFromBalance]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>JARVIS requires camera access for the HUD</Text>
        <Text style={styles.permissionBtn} onPress={requestPermission}>
          Grant Access
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* Touch overlay for simulating palm detection */}
        <View
          style={styles.touchOverlay}
          onTouchStart={simulatePalmStart}
          onTouchEnd={simulatePalmEnd}
          onTouchCancel={simulatePalmEnd}
        />

        {/* HUD Elements */}
        <Reticle scanning={palmDetected || scanning} />
        <ScanningBar progress={scanProgress} visible={palmDetected} />

        {/* Status indicator */}
        {scanning && (
          <View style={styles.statusWrap}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ANALYZING...</Text>
          </View>
        )}

        {profile && (
          <BudgetTicker
            currentBalance={profile.currentBalance}
            dailyBudget={profile.dailyFunBudget}
          />
        )}

        {/* Decision Overlay */}
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
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionBtn: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.accent,
    padding: 12,
  },
  statusWrap: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.green,
    letterSpacing: 1.5,
  },
});
