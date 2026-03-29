import { StyleSheet, View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
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

export default function TransactionsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/transactions`, {
        params: { limit: 50 }
      });
      return res.data.transactions || [];
    },
    refetchInterval: 30000,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Gestern, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      case 'refunded': return '↩';
      default: return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return Colors.accent;
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'refunded': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDesc} numberOfLines={1}>
            {item.description || 'Zahlung'}
          </Text>
          <Text style={[styles.transactionAmount, { color: getStatusColor(item.status) }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.transactionFooter}>
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          <Text style={[styles.transactionStatus, { color: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)} {
              item.status === 'succeeded' ? 'Bezahlt' :
              item.status === 'pending' ? 'Ausstehend' :
              item.status === 'failed' ? 'Fehlgeschlagen' :
              item.status === 'refunded' ? 'Erstattet' : item.status
            }
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Fehler beim Laden</Text>
        <Text style={styles.errorSubtext}>Ziehen zum Aktualisieren</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.accent}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Transaktionen</Text>
            <Text style={styles.emptySubtext}>Erstelle einen QR-Code um Zahlungen zu empfangen</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
  },
  transactionContent: {
    flex: 1,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDesc: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});
