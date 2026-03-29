import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import axios from 'axios';
import { useState, useCallback } from 'react';
import Colors from '@/constants/Colors';

const API_URL = process.env.EXPO_PUBLIC_SWIFTTAP_API_URL || 'https://swifttap-app.vercel.app';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface DashboardData {
  todayRevenue: number;
  todayCount: number;
  recentTransactions: Transaction[];
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // Fetch today's transactions
      const res = await axios.get(`${API_URL}/api/transactions`, {
        params: { limit: 10 }
      });
      
      const transactions: Transaction[] = res.data.transactions || [];
      const today = new Date().toISOString().split('T')[0];
      
      const todayTransactions = transactions.filter(t => 
        t.createdAt.startsWith(today) && t.status === 'succeeded'
      );
      
      return {
        todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
        todayCount: todayTransactions.length,
        recentTransactions: transactions.slice(0, 5),
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
    >
      {/* Tap to Pay Quick Access */}
      <TouchableOpacity 
        style={styles.tapToPayButton}
        onPress={() => router.push('/tap-to-pay')}
      >
        <Text style={styles.tapToPayIcon}>📶</Text>
        <View style={styles.tapToPayContent}>
          <Text style={styles.tapToPayTitle}>Tap to Pay</Text>
          <Text style={styles.tapToPaySubtitle}>Kontaktlose Zahlung empfangen</Text>
        </View>
        <Text style={styles.tapToPayArrow}>→</Text>
      </TouchableOpacity>

      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Umsatz heute</Text>
          <Text style={styles.statValue}>{formatCurrency(data?.todayRevenue || 0)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Zahlungen</Text>
          <Text style={styles.statValue}>{data?.todayCount || 0}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Letzte Zahlungen</Text>
        {data?.recentTransactions?.length === 0 && (
          <Text style={styles.emptyText}>Noch keine Zahlungen heute</Text>
        )}
        {data?.recentTransactions?.map((tx) => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionDesc}>{tx.description || 'Zahlung'}</Text>
              <Text style={styles.transactionTime}>{formatTime(tx.createdAt)}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                tx.status === 'succeeded' && styles.successText,
                tx.status === 'pending' && styles.pendingText,
              ]}>
                {formatCurrency(tx.amount)}
              </Text>
              <Text style={[
                styles.transactionStatus,
                tx.status === 'succeeded' && styles.successText,
                tx.status === 'pending' && styles.pendingText,
                tx.status === 'failed' && styles.failedText,
              ]}>
                {tx.status === 'succeeded' ? '✓ Bezahlt' : 
                 tx.status === 'pending' ? '⏳ Ausstehend' : '✗ Fehlgeschlagen'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  tapToPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 177, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 177, 0.3)',
  },
  tapToPayIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tapToPayContent: {
    flex: 1,
  },
  tapToPayTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tapToPaySubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  tapToPayArrow: {
    color: Colors.accent,
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    padding: 20,
  },
  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionDesc: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  transactionTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  successText: {
    color: Colors.accent,
  },
  pendingText: {
    color: '#f59e0b',
  },
  failedText: {
    color: '#ef4444',
  },
});
