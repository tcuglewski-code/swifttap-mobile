import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform, Alert, Modal, TextInput } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/Colors';

// NFC support check - will be fully implemented after native build
let NfcManager: any = null;
let NfcTech: any = null;

try {
  const nfc = require('react-native-nfc-manager');
  NfcManager = nfc.default;
  NfcTech = nfc.NfcTech;
} catch {
  // NFC not available in Expo Go
}

export default function TapToPayScreen() {
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [presetAmount, setPresetAmount] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkNfcSupport();
    return () => {
      if (NfcManager) {
        NfcManager.cancelTechnologyRequest?.();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [isListening]);

  const checkNfcSupport = async () => {
    if (!NfcManager) {
      setNfcSupported(false);
      return;
    }

    try {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);

      if (supported) {
        await NfcManager.start();
        const enabled = await NfcManager.isEnabled();
        setNfcEnabled(enabled);
      }
    } catch (error) {
      setNfcSupported(false);
    }
  };

  const startNfcListening = async () => {
    if (!NfcManager || !nfcEnabled) {
      Alert.alert(
        'NFC nicht verfügbar',
        'Bitte aktivieren Sie NFC in den Geräteeinstellungen.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsListening(true);

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag) {
        // NFC tag detected - show payment modal
        handleNfcTag(tag);
      }
    } catch (ex) {
      // User cancelled or timeout
      console.log('NFC session ended:', ex);
    } finally {
      setIsListening(false);
      NfcManager.cancelTechnologyRequest?.();
    }
  };

  const handleNfcTag = (tag: any) => {
    // For now, show amount input modal
    // In production, this would integrate with Stripe Terminal SDK
    setShowAmountModal(true);
  };

  const stopNfcListening = () => {
    setIsListening(false);
    if (NfcManager) {
      NfcManager.cancelTechnologyRequest?.();
    }
  };

  const handleAmountSubmit = () => {
    const amount = parseInt(presetAmount);
    if (amount > 0) {
      setShowAmountModal(false);
      // Navigate to QR screen with preset amount
      // In production: initiate Stripe Terminal payment
      Alert.alert(
        'Stripe Terminal',
        'Stripe Terminal SDK Integration kommt nach Apple Dev Account Setup.\n\nVorläufig: QR Code Zahlung nutzen.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { 
            text: 'QR Code', 
            onPress: () => router.push('/(tabs)/qr')
          }
        ]
      );
    }
    setPresetAmount('');
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Tap to Pay',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }} 
      />
      
      <View style={styles.container}>
        {/* NFC Status */}
        {nfcSupported === false && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              NFC ist auf diesem Gerät nicht verfügbar{'\n'}
              <Text style={styles.warningSubtext}>
                Tap to Pay erfordert ein NFC-fähiges Gerät
              </Text>
            </Text>
          </View>
        )}

        {nfcSupported && !nfcEnabled && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>📱</Text>
            <Text style={styles.warningText}>
              NFC ist deaktiviert{'\n'}
              <Text style={styles.warningSubtext}>
                Bitte in den Einstellungen aktivieren
              </Text>
            </Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* NFC Icon with Animation */}
          <Animated.View style={[
            styles.nfcIconContainer,
            { 
              transform: [
                { scale: pulseAnim },
                { rotate: spin }
              ] 
            }
          ]}>
            <View style={styles.nfcIconInner}>
              <Text style={styles.nfcIcon}>📶</Text>
            </View>
          </Animated.View>

          <Text style={styles.title}>
            {isListening ? 'Bereit zum Empfangen' : 'Tap to Pay'}
          </Text>
          
          <Text style={styles.subtitle}>
            {isListening 
              ? 'Halten Sie die Karte oder das Smartphone an das Gerät'
              : 'Kontaktlose Zahlungen empfangen'}
          </Text>

          {/* Action Button */}
          {!isListening ? (
            <TouchableOpacity
              style={[styles.startButton, !nfcEnabled && styles.buttonDisabled]}
              onPress={startNfcListening}
              disabled={!nfcEnabled}
            >
              <Text style={styles.startButtonText}>Zahlung starten</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={stopNfcListening}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
          )}

          {/* Stripe Terminal Notice */}
          <View style={styles.noticeBox}>
            <Text style={styles.noticeIcon}>ℹ️</Text>
            <Text style={styles.noticeText}>
              Vollständige Stripe Terminal Integration{'\n'}
              kommt nach Apple Developer Account Setup
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Stripe Terminal
          </Text>
          <View style={styles.footerBadges}>
            <Text style={styles.badge}>Apple Pay</Text>
            <Text style={styles.badge}>Google Pay</Text>
            <Text style={styles.badge}>Kontaktlos</Text>
          </View>
        </View>

        {/* Amount Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAmountModal}
          onRequestClose={() => setShowAmountModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Zahlungsbetrag</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0,00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={presetAmount}
                onChangeText={setPresetAmount}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAmountModal(false);
                    setPresetAmount('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalConfirmButton}
                  onPress={handleAmountSubmit}
                >
                  <Text style={styles.modalConfirmText}>Weiter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 16,
    gap: 12,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  warningSubtext: {
    fontWeight: '400',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  nfcIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 201, 177, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  nfcIconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 201, 177, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nfcIcon: {
    fontSize: 48,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 18,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 48,
    paddingVertical: 18,
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 16,
  },
  noticeIcon: {
    fontSize: 20,
  },
  noticeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 12,
  },
  footerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  amountInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
