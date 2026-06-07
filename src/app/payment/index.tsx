import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native'; 
import { useRouter } from 'expo-router';
import { authApiService } from '../../services/api';

interface Merchant {
  id: string;
  name: string;
  phone: string;
  initial: string;
  color: string;
  bgColor: string;
  ref?: string;
  isSaved?: boolean;
}

export default function PaymentIndexScreen() { 
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Merchant[]>([]);
  const [searching, setSearching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (search.trim().length < 1) {
      setSearchResults([]);
      setErrorMsg('');
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      setErrorMsg('');
      try {
        const res = await authApiService.searchUsers(search.trim());
        if (res.success && res.data && res.data.users) {
          const mapped = res.data.users.map((u: any) => {
            const colors = ['#2F80ED', '#FF9F1A', '#9B51E0', '#2ED573', '#EB5757'];
            const bgColors = ['#EBF3FF', '#FFF8ED', '#F6EDFF', '#EEFBF2', '#FFEFF0'];
            const idx = u.username.length % colors.length;
            return {
              id: u.id,
              name: u.full_name || u.username,
              phone: u.username,
              initial: '🛍️',
              color: colors[idx],
              bgColor: bgColors[idx]
            };
          });
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to search merchants:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSelectMerchant = (merchant: Merchant) => {
    router.push({
      pathname: '/payment/amount',
      params: { 
        name: merchant.name,
        phone: merchant.phone,
        color: merchant.color,
        bgColor: merchant.bgColor,
        initial: merchant.initial
      }
    });
  };

  const handleManualPayment = async () => {
    if (!search.trim()) return;
    setValidating(true);
    setErrorMsg('');
    try {
      const res = await authApiService.checkReceiver(search.trim());
      if (res.success && res.data && res.data.username) {
        router.push({
          pathname: '/payment/amount',
          params: { 
            name: res.data.username,
            phone: res.data.username,
            color: '#2F80ED',
            bgColor: '#EBF3FF',
            initial: '🛍️'
          }
        });
      } else {
        setErrorMsg(res.error || 'Merchant username not found in database.');
      }
    } catch (err) {
      setErrorMsg('Failed to validate merchant. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Fixed Top Header + Search Bar Area */}
      <View style={styles.topHeaderContainer}>
        <View style={styles.header}>
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </View>

        {/* Floating Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput 
            placeholder="Enter merchant username" 
            placeholderTextColor="#999"
            style={styles.searchInput} 
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setErrorMsg('');
            }}
            onSubmitEditing={handleManualPayment}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Scan QR Code Action Card */}
        <TouchableOpacity 
          style={styles.scanQrCard} 
          onPress={() => router.push('/scan')}
          activeOpacity={0.85}
        >
          <View style={styles.scanQrContent}>
            <Image
              source={require('../../../assets/qr.png')}
              style={styles.scanQrIcon}
            />
            <Text style={styles.scanQrText}>Scan QR Code</Text>
          </View>
        </TouchableOpacity>

        {errorMsg.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {validating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#004BCE" />
            <Text style={styles.loadingText}>Validating merchant username...</Text>
          </View>
        )}

        {searching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004BCE" />
            <Text style={styles.loadingText}>Searching NiroPay database...</Text>
          </View>
        ) : search.trim().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🛍️</Text>
            <Text style={styles.emptyStateTitle}>Pay a Merchant</Text>
            <Text style={styles.emptyStateText}>
              Search for merchant usernames in the database or scan a merchant QR code to proceed.
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📭</Text>
            <Text style={styles.emptyStateTitle}>No Merchant Found</Text>
            <Text style={styles.emptyStateText}>
              We couldn't find any registered accounts matching "{search.trim()}". Press Enter to validate directly.
            </Text>
          </View>
        ) : (
          /* Search Results Section */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Database Search Results</Text>
            </View>

            {searchResults.map(m => (
              <TouchableOpacity 
                key={m.id} 
                style={styles.contactCard} 
                onPress={() => handleSelectMerchant(m)} 
                activeOpacity={0.7}
              >
                <View style={[styles.avatarCircle, { backgroundColor: m.bgColor }]}>
                  <Text style={[styles.avatarIcon, { color: m.color }]}>{m.initial}</Text>
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName} numberOfLines={1}>{m.name}</Text>
                  <Text style={styles.contactPhone}>@{m.phone}</Text>
                </View>
                <Text style={styles.chevron}>&gt;</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC' 
  },
  topHeaderContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: { 
    backgroundColor: '#0A1F44', 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 24,
    elevation: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: '#163D7A',
  },
  headerSafeArea: {
    width: '100%'
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backArrow: { 
    color: '#FFFFFF', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerPlaceholder: {
    width: 40,
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginTop: -20, 
    borderRadius: 20, 
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16, 
    height: 52,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  searchEmoji: { 
    fontSize: 16, 
    marginRight: 10, 
    color: '#6B7280' 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: '#111827',
    fontWeight: '500'
  },
  contentScroll: { 
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  scanQrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  scanQrContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanQrIcon: {
    width: 24,
    height: 24,
    tintColor: '#00C2FF',
    marginRight: 12
  },
  scanQrText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44'
  },
  section: { 
    marginBottom: 24 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#0A1F44' 
  },
  viewAllBtn: { 
    color: '#163D7A', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  contactCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarIcon: { 
    fontSize: 20, 
  },
  contactDetails: { 
    flex: 1,
    justifyContent: 'center'
  },
  contactName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  contactPhone: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginTop: 2 
  },
  contactRef: {
    fontSize: 11,
    color: '#00C853',
    fontWeight: '600',
    marginTop: 2
  },
  chevron: { 
    fontSize: 16, 
    color: '#9CA3AF', 
    fontWeight: 'bold',
    marginRight: 4
  },
  moreAction: {
    padding: 6,
    marginRight: -4
  },
  dotsText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold'
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  }
});
