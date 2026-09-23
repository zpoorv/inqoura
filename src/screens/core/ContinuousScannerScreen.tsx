import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { addBasketItem, useBasketStore } from '../../store/basketStore';
import DynamicBasketIsland from '../../components/layout/DynamicBasketIsland';
import LivingReticle from '../../components/scanner/LivingReticle';
import { playCleanChime, playDangerAlert, playSnapSound } from '../../utils/audioEngine';
import { triggerCautionHaptic, triggerDangerHaptic, triggerSafeHaptic } from '../../utils/haptics';
import { resolveProductByBarcode } from '../../services/productLookup';
import { normalizeBarcode } from '../../utils/barcode';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function ContinuousScannerScreen({ navigation }: Props) {
  const recentScansRef = useRef<Map<string, number>>(new Map());
  const [reticleStatus, setReticleStatus] = useState<'searching' | 'locked' | 'danger'>('searching');
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    const barcode = normalizeBarcode(data);
    if (!barcode) return;

    const now = Date.now();
    const lastScanTime = recentScansRef.current.get(barcode) || 0;
    if (now - lastScanTime < 2500) {
      return; // Deduplicate within 2.5s window
    }
    recentScansRef.current.set(barcode, now);

    setReticleStatus('locked');
    void playSnapSound();

    try {
      const product = await resolveProductByBarcode(barcode);
      if (!product) {
        setReticleStatus('searching');
        return;
      }

      setLastScannedName(product.name);

      // Check if product contains known allergens or severe NOVA 4
      const isHazard = (product.allergens && product.allergens.length > 0) || product.novaGroup === 4;

      if (isHazard) {
        setReticleStatus('danger');
        triggerDangerHaptic();
        void playDangerAlert();
      } else {
        setReticleStatus('locked');
        triggerSafeHaptic();
        void playCleanChime();
      }

      addBasketItem(product, isHazard);

      setTimeout(() => {
        setReticleStatus('searching');
      }, 1200);
    } catch {
      triggerCautionHaptic();
      setReticleStatus('searching');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Top Header Controls */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>✕</Text>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Continuous Basket Sweep</Text>
          <Text style={styles.headerSubtitle}>Point & scan items in rapid succession</Text>
        </View>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraWrapper}>
        <CameraView
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
          }}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Dynamic Living Reticle */}
        <View style={styles.reticleOverlay} pointerEvents="none">
          <LivingReticle status={reticleStatus} defaultWidth={260} defaultHeight={180} />
          {lastScannedName && (
            <View style={styles.feedbackPill}>
              <Text numberOfLines={1} style={styles.feedbackText}>
                {lastScannedName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Dynamic Island Floating at Bottom */}
      <DynamicBasketIsland />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackPill: {
    marginTop: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '80%',
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
