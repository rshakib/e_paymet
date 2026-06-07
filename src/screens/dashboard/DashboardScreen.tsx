import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';

export default function DashboardScreen() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [fullName, setFullName] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const username = globalSession.registeredUser.username;
        if (!username) return;

        // Fetch User Profile
        const profileRes = await authApiService.getUserProfile(username);
        if (profileRes.success && profileRes.data) {
          setBalance(profileRes.data.user.balance);
          setFullName(profileRes.data.user.full_name);
        } else if (profileRes.error && (profileRes.error.includes('401') || profileRes.error.includes('Unauthorized'))) {
          globalSession.isLoggedIn = false;
          router.replace('/');
          return;
        }

        // Fetch Transactions
        const txRes = await authApiService.getTransactions(username);
        if (txRes.success && txRes.data) {
          setTransactions(txRes.data.transactions || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formattedBalance = balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <View style={styles.parentView}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.hello}>Hello,</Text>
              <Text style={styles.name}>{loading ? '...' : (fullName || 'User')} 👋</Text>
            </View>
            <TouchableOpacity 
              style={styles.headerAvatarCircle} 
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.headerAvatarEmoji}>👤</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.balanceCard} 
            onPress={() => setShowBalance(prev => !prev)}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <View style={styles.showHideBadge}>
                <Text style={styles.showHideText}>
                  {showBalance ? 'Hide 👁️' : 'Show 👁️'}
                </Text>
              </View>
            </View>
            <Text style={styles.balance}>
              {showBalance ? `৳ ${formattedBalance}` : '৳ ••••'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsCard}>
          <View style={styles.row}>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/send')}>
              <View style={[styles.iconBox, { backgroundColor: '#EBF3FF', borderColor: '#D0E3FF' }]}><Text style={styles.iconEmoji}>✈️</Text></View>
              <Text style={styles.actionText}>Send Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/recharge')}>
              <View style={[styles.iconBox, { backgroundColor: '#E8FDF5', borderColor: '#C4F7E3' }]}><Text style={styles.iconEmoji}>📱</Text></View>
              <Text style={styles.actionText}>Recharge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/payment')}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF4E5', borderColor: '#FFE4C4' }]}><Text style={styles.iconEmoji}>💳</Text></View>
              <Text style={styles.actionText}>Payment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/bill')}>
              <View style={[styles.iconBox, { backgroundColor: '#F3EBF9', borderColor: '#E5D5F4' }]}><Text style={styles.iconEmoji}>📄</Text></View>
              <Text style={styles.actionText}>Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/tickets')}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF0F0', borderColor: '#FFD1D1' }]}><Text style={styles.iconEmoji}>🎟️</Text></View>
              <Text style={styles.actionText}>Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.item} onPress={() => router.push('/cash-out')}>
              <View style={[styles.iconBox, { backgroundColor: '#EAF9EB', borderColor: '#CDF2D1' }]}><Text style={styles.iconEmoji}>💵</Text></View>
              <Text style={styles.actionText}>Cash Out</Text>
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My NiroPay</Text>
          <TouchableOpacity onPress={() => router.push('/services')} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.myNiroRow}>
          <TouchableOpacity style={styles.myNiroCard} onPress={() => router.push('/bank-transfer')}>
            <View style={styles.myNiroIcon}><Text style={styles.myNiroEmoji}>🏦</Text></View>
            <Text style={styles.myNiroTitle}>Bank Transfer</Text>
            <Text style={styles.myNiroSubtitle}>Send to Bank</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.myNiroCard} onPress={() => router.push('/my-cards')}>
            <View style={styles.myNiroIcon}><Text style={styles.myNiroEmoji}>💳</Text></View>
            <Text style={styles.myNiroTitle}>My Cards</Text>
            <Text style={styles.myNiroSubtitle}>Manage Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.myNiroCard} onPress={() => router.push('/savings')}>
            <View style={styles.myNiroIcon}><Text style={styles.myNiroEmoji}>📊</Text></View>
            <Text style={styles.myNiroTitle}>Savings</Text>
            <Text style={styles.myNiroSubtitle}>Save Money</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')} hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
            <Text style={styles.viewAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {loading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#0A1F44" size="small" />
            </View>
          ) : transactions.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#8A99AD', fontSize: 13 }}>No recent transactions</Text>
            </View>
          ) : (
            transactions.slice(0, 3).map((item: any, index: number) => {
              const isReceived = item.type === 'received';
              const category = item.category || 'transfer';
              
              let title = '';
              let emoji = isReceived ? '💰' : '💸';
              let bgColor = isReceived ? '#E7F9F0' : '#FFEDF1';

              if (isReceived) {
                title = `Cash In (from ${item.sender_username || 'Bank'})`;
              } else {
                if (category === 'recharge') {
                  title = 'Mobile Recharge';
                  emoji = '📱';
                  bgColor = '#E8FDF5';
                } else if (category === 'bill') {
                  title = 'Bill Payment';
                  emoji = '📄';
                  bgColor = '#F3EBF9';
                } else if (category === 'payment') {
                  title = 'Merchant Payment';
                  emoji = '💳';
                  bgColor = '#FFF4E5';
                } else {
                  title = `Send Money (to ${item.receiver_username || 'User'})`;
                }
              }
              
              const txDate = new Date(item.created_at);
              const formattedDate = txDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const formattedTime = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const subtitle = `${formattedDate}, ${formattedTime}`;
              
              const amountText = `${isReceived ? '+' : '-'}৳${parseFloat(item.amount).toFixed(2)}`;
              
              return (
                <View key={item.id || index}>
                  <View style={styles.transactionItem}>
                    <View style={[styles.transactionIcon, { backgroundColor: bgColor }]}>
                      <Text style={styles.transEmoji}>{emoji}</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{title}</Text>
                      <Text style={styles.transactionSubtitle}>{subtitle}</Text>
                    </View>
                    <Text style={[styles.transactionAmount, isReceived ? styles.positive : styles.negative]}>
                      {amountText}
                    </Text>
                  </View>
                  {index < Math.min(transactions.length, 3) - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/')}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.active}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/transactions')}>
          <Text style={styles.navIconInactive}>📄</Text>
          <Text style={styles.inactive}>Transactions</Text>
        </TouchableOpacity>

        <View style={styles.centerGap}/>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/services')}>
          <Text style={styles.navIconInactive}>📦</Text>
          <Text style={styles.inactive}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIconInactive}>👤</Text>
          <Text style={styles.inactive}>Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scanWrap} onPress={() => router.push('/scan')} activeOpacity={0.9}>
        <View style={styles.scanBtn}>
          <Image
            source={require('../../../assets/qr.png')}
            style={styles.scanIconImage}
          />
        </View>
        <Text style={styles.scanText}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  parentView: { flex: 1, backgroundColor: '#F4F6F9' },
  container: { flex: 1 },
  header: { 
    backgroundColor: '#0A1F44', 
    paddingTop: 65, 
    paddingBottom: 85, 
    paddingHorizontal: 24, 
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerAvatarCircle: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: 'rgba(255, 255, 255, 0.12)', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerAvatarEmoji: { fontSize: 22, marginTop: -2 },
  hello: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 15, fontWeight: '500' },
  name: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  balanceCard: { 
    marginTop: 24, 
    backgroundColor: '#1E3E72', 
    padding: 22, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: '600' },
  showHideBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  showHideText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  balance: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  actionsCard: { 
    marginTop: -45, 
    marginHorizontal: 20, 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    paddingVertical: 22, 
    paddingHorizontal: 16, 
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F2F6',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  item: { alignItems: 'center', flex: 1 },
  iconBox: { 
    width: 56, 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconEmoji: { fontSize: 24 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#1A2E4C', textAlign: 'center' },
  sectionHeader: { marginTop: 28, marginHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0A1F44' },
  viewAll: { color: '#0066FF', fontWeight: '700', fontSize: 14 },
  myNiroRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18, marginTop: 12 },
  myNiroCard: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    marginHorizontal: 6, 
    borderRadius: 20, 
    paddingVertical: 18, 
    paddingHorizontal: 8, 
    alignItems: 'center', 
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F2F6',
  },
  myNiroIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 15, 
    backgroundColor: '#F3F6FA', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  myNiroEmoji: { fontSize: 20 },
  myNiroTitle: { fontSize: 13, fontWeight: '700', color: '#0A1F44', textAlign: 'center' },
  myNiroSubtitle: { fontSize: 10, color: '#8A99AD', marginTop: 2, textAlign: 'center' },
  activityCard: { 
    backgroundColor: '#ffffff', 
    marginHorizontal: 20, 
    marginTop: 14, 
    borderRadius: 24, 
    paddingVertical: 8,
    paddingHorizontal: 20, 
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F2F6',
  },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transEmoji: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionTitle: { fontSize: 15, fontWeight: '700', color: '#0A1F44' },
  transactionSubtitle: { fontSize: 12, color: '#8A99AD', marginTop: 3 },
  transactionAmount: { fontSize: 15, fontWeight: '700' },
  positive: { color: '#2E7D32' },
  negative: { color: '#D32F2F' },
  divider: { height: 1, backgroundColor: '#F3F5F8', marginVertical: 1 },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F0F2F6',
    paddingBottom: 8,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navIconActive: { fontSize: 22, color: '#0A1F44' },
  navIconInactive: { fontSize: 22, color: '#8A99AD', opacity: 0.8 },
  active: { color: '#0A1F44', fontSize: 11, fontWeight: '700', marginTop: 4 },
  inactive: { color: '#8A99AD', fontSize: 11, fontWeight: '500', marginTop: 4 },
  centerGap: { width: 60 },
  scanWrap: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  scanBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  scanIconImage: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  scanText: { fontSize: 11, fontWeight: '700', color: '#0A1F44', marginTop: 5 },
});