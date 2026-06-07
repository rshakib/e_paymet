import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { globalSession } from '../constants/auth';
import { authApiService } from '../services/api';

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in' | 'out' | 'bills'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const username = globalSession.registeredUser.username;
        if (!username) return;
        const res = await authApiService.getTransactions(username);
        if (res.success && res.data) {
          setTransactions(res.data.transactions || []);
        } else if (res.error && (res.error.includes('401') || res.error.includes('Unauthorized'))) {
          globalSession.isLoggedIn = false;
          router.replace('/');
          return;
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'in', label: 'Cash In' },
    { key: 'out', label: 'Cash Out / Send' },
    { key: 'bills', label: 'Bills & Topups' },
  ] as const;

  const getGroupedTransactions = () => {
    const mapped = transactions.map((item: any) => {
      const isReceived = item.type === 'received';
      const category = item.category || 'transfer';
      
      let title = '';
      let emoji = isReceived ? '💰' : '💸';
      let bgIconColor = isReceived ? '#E7F9F0' : '#F0F3FF';

      if (isReceived) {
        title = `Cash In (from ${item.sender_username || 'Bank'})`;
      } else {
        if (category === 'recharge') {
          title = 'Mobile Recharge';
          emoji = '📱';
          bgIconColor = '#E8FDF5';
        } else if (category === 'bill') {
          title = 'Bill Payment';
          emoji = '📄';
          bgIconColor = '#F3EBF9';
        } else if (category === 'payment') {
          title = 'Merchant Payment';
          emoji = '💳';
          bgIconColor = '#FFF4E5';
        } else {
          title = `Send Money (to ${item.receiver_username || 'User'})`;
        }
      }
      
      const txDate = new Date(item.created_at);
      const subtitle = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const amount = `${isReceived ? '+' : '-'}৳${parseFloat(item.amount).toFixed(2)}`;

      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      const itemDateStr = txDate.toDateString();
      
      let dateGroup = txDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
      if (itemDateStr === todayStr) {
        dateGroup = 'Today';
      } else if (itemDateStr === yesterdayStr) {
        dateGroup = 'Yesterday';
      }

      return {
        id: item.id,
        title,
        subtitle,
        type: (isReceived ? 'in' : 'out') as 'in' | 'out',
        category,
        amount,
        emoji,
        bgIconColor,
        dateGroup
      };
    });

    const groups: { date: string; items: any[] }[] = [];
    mapped.forEach((item) => {
      let group = groups.find(g => g.date === item.dateGroup);
      if (!group) {
        group = { date: item.dateGroup, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    
    return groups;
  };

  const getFilteredTransactions = () => {
    const grouped = getGroupedTransactions();
    return grouped.map(group => {
      const filteredItems = group.items.filter(item => {
        if (selectedFilter === 'all') return true;
        if (selectedFilter === 'in') return item.type === 'in';
        if (selectedFilter === 'out') return item.type === 'out' && item.category === 'transfer';
        if (selectedFilter === 'bills') return item.category === 'bill' || item.category === 'recharge' || item.category === 'payment'; 
        return true;
      });
      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
  };

  const filteredGroups = getFilteredTransactions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />

      {/* Royal Navy Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Horizontal Filters Section */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(item => {
            const isActive = selectedFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0A1F44" />
          </View>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptySub}>No activities match the selected filter category.</Text>
          </View>
        ) : (
          filteredGroups.map(group => (
            <View key={group.date} style={styles.groupContainer}>
              <Text style={styles.groupDateHeader}>{group.date}</Text>
              
              <View style={styles.cardWrapper}>
                {group.items.map((item, idx) => (
                  <View key={item.id}>
                    <View style={styles.transactionItem}>
                      <View style={[styles.transactionIcon, { backgroundColor: item.bgIconColor }]}>
                        <Text style={styles.transEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <Text style={styles.transactionSubtitle}>{item.subtitle}</Text>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        item.type === 'in' ? styles.positive : styles.negative
                      ]}>
                        {item.amount}
                      </Text>
                    </View>
                    {idx < group.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { 
    backgroundColor: '#0A1F44', 
    paddingTop: 45, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerSafeArea: { width: '100%' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backArrow: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  filterWrapper: {
    paddingVertical: 14,
    backgroundColor: '#F7F9FC',
  },
  filterScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#0A1F44',
    borderColor: '#0A1F44',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupDateHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 20,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F2F6',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transEmoji: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A1F44',
  },
  transactionSubtitle: {
    fontSize: 12,
    color: '#8A99AD',
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  positive: {
    color: '#00C853',
  },
  negative: {
    color: '#D32F2F',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F5F8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1F44',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#8A99AD',
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});
