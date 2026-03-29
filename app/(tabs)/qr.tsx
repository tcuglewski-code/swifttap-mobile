import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Modal, Image, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';
import Colors from '@/constants/Colors';

const API_URL = process.env.EXPO_PUBLIC_SWIFTTAP_API_URL || 'https://swifttap-app.vercel.app';

interface PaymentRequest {
  paymentId: string;
  qrUrl: string;
  payUrl: string;
  amount: number;
  expiresAt: string | null;
}

interface PaymentStatus {
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
}

export default function QRScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [payment, setPayment] = useState<PaymentRequest | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'succeeded' | 'failed'>('pending');
  
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`${API_URL}/api/v1/payment-request`, {
        amount: parseInt(amount),
        description: description || 'SwiftTap Zahlung',
        expiresInMinutes: 30,
      });
      return res.data as PaymentRequest;
    },
    onSuccess: (data) => {
      setPayment(data);
      setPaymentStatus('pending');
      setModalVisible(true);
      startPolling(data.paymentId);
    },
  });

  const startPolling = (paymentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/payment-status/${paymentId}`);
        const status = res.data as PaymentStatus;
        
        if (status.status === 'succeeded') {
          setPaymentStatus('succeeded');
          stopPolling();
          triggerSuccessAnimation();
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          setPaymentStatus('failed');
          stopPolling();
        }
      } catch {
        // Continue polling on error
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const triggerSuccessAnimation = () => {
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Confetti animation
    Animated.timing(confettiAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const closeModal = () => {
    stopPolling();
    setModalVisible(false);
    setPayment(null);
    setPaymentStatus('pending');
    setAmount('');
    setDescription('');
    confettiAnim.setValue(0);
  };

  const formatDisplay = (value: string) => {
    const num = parseFloat(value) / 100;
    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const handleNumpad = (key: string) => {
    if (key === 'C') {
      setAmount('');
    } else if (key === '⌫') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      if (amount.length < 8) {
        setAmount(prev => prev + key);
      }
    }
  };

  const amountInCents = parseInt(amount) || 0;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>€</Text>
          <Text style={styles.amountText}>
            {amount ? formatDisplay(amount) : '0,00'}
          </Text>
        </View>

        {/* Description Input */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Beschreibung (optional)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={description}
          onChangeText={setDescription}
        />

        {/* Numpad */}
        <View style={styles.numpad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.numpadKey,
                key === 'C' && styles.clearKey,
                key === '⌫' && styles.backspaceKey,
              ]}
              onPress={() => handleNumpad(key)}
            >
              <Text style={[
                styles.numpadKeyText,
                (key === 'C' || key === '⌫') && styles.specialKeyText,
              ]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, (!amountInCents || createPaymentMutation.isPending) && styles.generateButtonDisabled]}
          disabled={!amountInCents || createPaymentMutation.isPending}
          onPress={() => createPaymentMutation.mutate()}
        >
          <Text style={styles.generateButtonText}>
            {createPaymentMutation.isPending ? 'Wird erstellt...' : 'QR Code generieren'}
          </Text>
        </TouchableOpacity>

        {createPaymentMutation.isError && (
          <Text style={styles.errorText}>
            Fehler: {(createPaymentMutation.error as Error)?.message || 'Verbindungsfehler'}
          </Text>
        )}

        {/* QR Code Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {paymentStatus === 'pending' && payment && (
                <>
                  <Text style={styles.modalAmount}>{formatCurrency(payment.amount)}</Text>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={payment.payUrl}
                      size={200}
                      backgroundColor="#fff"
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.modalHint}>QR-Code scannen zum Bezahlen</Text>
                  <View style={styles.pendingIndicator}>
                    <Text style={styles.pendingDot}>⏳</Text>
                    <Text style={styles.pendingText}>Warte auf Zahlung...</Text>
                  </View>
                </>
              )}

              {paymentStatus === 'succeeded' && payment && (
                <Animated.View style={[styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successIconText}>✓</Text>
                  </View>
                  <Text style={styles.successTitle}>Bezahlt!</Text>
                  <Text style={styles.successAmount}>{formatCurrency(payment.amount)}</Text>
                  
                  {/* Confetti Effect */}
                  <Animated.View style={[styles.confetti, { opacity: confettiAnim }]}>
                    {['🎉', '✨', '💰', '🎊'].map((emoji, i) => (
                      <Text key={i} style={[styles.confettiEmoji, { 
                        left: `${20 + i * 20}%`,
                        animationDelay: `${i * 100}ms`
                      }]}>
                        {emoji}
                      </Text>
                    ))}
                  </Animated.View>
                  
                  <TouchableOpacity style={styles.doneButton} onPress={closeModal}>
                    <Text style={styles.doneButtonText}>Fertig</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {paymentStatus === 'failed' && (
                <View style={styles.failedContainer}>
                  <View style={styles.failedIcon}>
                    <Text style={styles.failedIconText}>✗</Text>
                  </View>
                  <Text style={styles.failedTitle}>Zahlung fehlgeschlagen</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setPaymentStatus('pending');
                    createPaymentMutation.mutate();
                  }}>
                    <Text style={styles.retryButtonText}>Erneut versuchen</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginVertical: 30,
  },
  currencySymbol: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 32,
    marginRight: 8,
  },
  amountText: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '700',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  numpadKey: {
    width: '28%',
    aspectRatio: 1.6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numpadKeyText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '500',
  },
  clearKey: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  backspaceKey: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  specialKeyText: {
    fontSize: 22,
  },
  generateButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
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
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 16,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingDot: {
    fontSize: 18,
  },
  pendingText: {
    color: '#f59e0b',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    color: '#fff',
    fontSize: 40,
  },
  successTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  successAmount: {
    color: Colors.accent,
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 24,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 24,
    top: 10,
  },
  doneButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  failedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  failedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  failedIconText: {
    color: '#ef4444',
    fontSize: 40,
  },
  failedTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
