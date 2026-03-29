import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';
import Colors from '@/constants/Colors';

const API_URL = process.env.EXPO_PUBLIC_SWIFTTAP_API_URL || 'https://swifttap-app.vercel.app';

interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  description?: string;
  paidAt: string | null;
}

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<PaymentStatus>({
    queryKey: ['payment', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/payment-status/${id}`);
      return res.data;
    },
    refetchInterval: (query) => {
      // Stop polling when payment is complete
      if (query.state.data?.status === 'succeeded' || 
          query.state.data?.status === 'failed' ||
          query.state.data?.status === 'cancelled') {
        return false;
      }
      return 2000; // Poll every 2s while pending
    },
    enabled: !!id,
  });

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  // Auto-navigate back after success
  useEffect(() => {
    if (data?.status === 'succeeded') {
      const timer = setTimeout(() => {
        router.back();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data?.status]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Zahlung wird geladen...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Text style={styles.iconText}>✗</Text>
        </View>
        <Text style={styles.title}>Zahlung nicht gefunden</Text>
        <Text style={styles.subtitle}>Die angeforderte Zahlung existiert nicht</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.status === 'pending' && (
        <>
          <ActivityIndicator size="large" color="#f59e0b" style={styles.icon} />
          <Text style={styles.title}>Warte auf Zahlung</Text>
          <Text style={styles.amount}>{formatCurrency(data.amount)}</Text>
          {data.description && (
            <Text style={styles.description}>{data.description}</Text>
          )}
          <Text style={styles.hint}>Der Kunde scannt gerade den QR-Code...</Text>
        </>
      )}

      {data.status === 'succeeded' && (
        <>
          <View style={[styles.statusIcon, styles.successIcon]}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.title}>Zahlung erfolgreich!</Text>
          <Text style={[styles.amount, styles.successAmount]}>{formatCurrency(data.amount)}</Text>
          {data.description && (
            <Text style={styles.description}>{data.description}</Text>
          )}
          <Text style={styles.hint}>Vielen Dank!</Text>
        </>
      )}

      {(data.status === 'failed' || data.status === 'cancelled') && (
        <>
          <View style={[styles.statusIcon, styles.errorIcon]}>
            <Text style={styles.iconText}>✗</Text>
          </View>
          <Text style={styles.title}>
            {data.status === 'cancelled' ? 'Zahlung abgebrochen' : 'Zahlung fehlgeschlagen'}
          </Text>
          <Text style={styles.amount}>{formatCurrency(data.amount)}</Text>
          <Text style={styles.hint}>Bitte versuchen Sie es erneut</Text>
        </>
      )}

      {data.status === 'refunded' && (
        <>
          <View style={[styles.statusIcon, styles.refundIcon]}>
            <Text style={styles.iconText}>↩</Text>
          </View>
          <Text style={styles.title}>Zahlung erstattet</Text>
          <Text style={styles.amount}>{formatCurrency(data.amount)}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: 'rgba(0, 201, 177, 0.2)',
  },
  errorIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  refundIcon: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconText: {
    fontSize: 40,
    color: '#fff',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  amount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  successAmount: {
    color: Colors.accent,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 24,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
  },
});
