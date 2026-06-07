import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native'; 
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts/legacy';
import { authApiService } from '../../services/api';

interface Operator {
  id: string;
  name: string;
  prefix: string[];
  color: string;
  logoColor: string;
}

export default function RechargeIndexScreen() { 
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Recent'>('All');
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initData = async () => {
      try {
        const username = globalSession.registeredUser.username;
        if (!username) return;

        // 1. Fetch Operators from backend
        const opRes = await authApiService.getRechargeOperators();
        if (opRes.success && opRes.data && opRes.data.operators) {
          setOperators(opRes.data.operators);
        }

        // 2. Fetch Recent Transactions to derive Recent Recipients
        const txRes = await authApiService.getTransactions(username);
        if (txRes.success && txRes.data) {
          const recharges = txRes.data.transactions.filter((t: any) => t.category === 'recharge');
          const uniquePhones = new Set();
          const recentList: any[] = [];

          recharges.forEach((r: any) => {
            // Reference format: "Recharge to 017XXXXXXXX (Operator)"
            const match = r.reference.match(/to ([\+\d]+)/);
            if (match && match[1]) {
              const phone = match[1];
              if (!uniquePhones.has(phone)) {
                uniquePhones.add(phone);
                recentList.push({
                  id: `recent-${r.id}`,
                  name: phone, // We don't have the contact name in TX history, so use phone
                  phone: phone,
                  initial: '📱',
                  color: '#163D7A',
                  recent: true
                });
              }
            }
          });
          setRecentRecipients(recentList.slice(0, 10));
        }

        // 3. Request Contacts Permission
        const { status } = await Contacts.requestPermissionsAsync();
        const granted = status === 'granted';
        setHasPermission(granted);

        if (granted) {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          });
          
          if (data && data.length > 0) {
            const mapped = data
              .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
              .map((c, idx) => {
                const rawPhone = c.phoneNumbers![0].number || '';
                const cleanPhone = rawPhone.replace(/[\s-]/g, '');
                const colors = ['#5C6BC0', '#4CAF50', '#2196F3', '#FF9F1A', '#9C27B0', '#009688', '#E91E63'];
                const color = colors[c.name.length % colors.length];
                
                return {
                  id: c.id || idx.toString(),
                  name: c.name,
                  phone: cleanPhone,
                  initial: c.name.charAt(0).toUpperCase() || '📱',
                  color: color,
                  favorite: false,
                  recent: false,
                  all: true
                };
              });
            setContacts(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to initialize mobile recharge data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Auto-detect operator based on phone prefix
  const detectOperator = (phoneNumber: string): string | null => {
    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    for (const op of operators) {
      if (op.prefix.some(pre => cleanNumber.startsWith(pre) || cleanNumber.startsWith('+88' + pre) || cleanNumber.startsWith('88' + pre))) {
        return op.id;
      }
    }
    return null;
  };

  const handleSelectContact = (contact: any) => {
    const operatorId = detectOperator(contact.phone) || selectedOperator || 'gp';
    const operatorObj = operators.find(op => op.id === operatorId);
    
    router.push({
      pathname: '/recharge/amount',
      params: { 
        name: contact.name,
        phone: contact.phone,
        initial: contact.initial,
        avatarColor: contact.color,
        operator: operatorObj?.name || 'Grameenphone',
        operatorColor: operatorObj?.color || '#00A8FF'
      }
    });
  };

  const handleManualRecharge = () => {
    if (!search) return;
    const operatorId = detectOperator(search) || selectedOperator || 'gp';
    const operatorObj = operators.find(op => op.id === operatorId);

    router.push({
      pathname: '/recharge/amount',
      params: { 
        name: 'Manual Recharge',
        phone: search,
        initial: '📱',
        avatarColor: '#163D7A',
        operator: operatorObj?.name || 'Grameenphone',
        operatorColor: operatorObj?.color || '#00A8FF'
      }
    });
  };

  // Filter contacts based on search input
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

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
              <Text style={styles.headerTitle}>Mobile Recharge</Text>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </View>

        {/* Overlapping Mobile Input / Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput 
            placeholder="Enter mobile number or name" 
            placeholderTextColor="#999"
            keyboardType="default"
            style={styles.searchInput} 
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              const op = detectOperator(text);
              if (op) setSelectedOperator(op);
            }}
          />
          {search.replace(/[\s-]/g, '').length >= 11 && (
            <TouchableOpacity style={styles.arrowButton} onPress={handleManualRecharge}>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersArea}>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'All' && styles.filterChipActive]} 
          onPress={() => setActiveFilter('All')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'All' && styles.filterChipTextActive]}>All Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, activeFilter === 'Recent' && styles.filterChipActive]} 
          onPress={() => setActiveFilter('Recent')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'Recent' && styles.filterChipTextActive]}>Recent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#0A1F44" size="large" />
            <Text style={{ marginTop: 12, color: '#8A99AD' }}>Loading contacts...</Text>
          </View>
        ) : activeFilter === 'Recent' ? (
          /* RECENT RECIPIENTS LIST */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Recipients</Text>
            </View>
            {recentRecipients.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ color: '#8A99AD', fontSize: 14 }}>No recent recharges found</Text>
              </View>
            ) : (
              recentRecipients.map(c => (
                <TouchableOpacity key={c.id} style={styles.contactCard} onPress={() => handleSelectContact(c)} activeOpacity={0.7}>
                  <View style={[styles.avatarCircle, { backgroundColor: c.color }]}>
                    <Text style={styles.avatarText}>{c.initial}</Text>
                  </View>
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                  <Text style={styles.chevron}>&gt;</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionEmoji}>👥</Text>
            <Text style={styles.permissionTitle}>Contacts Permission Required</Text>
            <Text style={styles.permissionText}>
              Please allow NiroPay to access your contacts to select recipients directly from your address book.
            </Text>
            <TouchableOpacity 
              style={styles.permissionBtn} 
              onPress={async () => {
                const { status } = await Contacts.requestPermissionsAsync();
                if (status === 'granted') {
                  setLoading(true);
                  const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                  });
                  if (data && data.length > 0) {
                    const mapped = data
                      .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
                      .map((c, idx) => {
                        const rawPhone = c.phoneNumbers![0].number || '';
                        const cleanPhone = rawPhone.replace(/[\s-]/g, '');
                        const colors = ['#5C6BC0', '#4CAF50', '#2196F3', '#FF9F1A', '#9C27B0', '#009688', '#E91E63'];
                        const color = colors[c.name.length % colors.length];
                        return {
                          id: c.id || idx.toString(),
                          name: c.name,
                          phone: cleanPhone,
                          initial: c.name.charAt(0).toUpperCase() || '📱',
                          color: color,
                          favorite: false,
                          recent: false,
                          all: true
                        };
                      });
                    setContacts(mapped);
                  }
                  setHasPermission(true);
                  setLoading(false);
                } else {
                  import('react-native').then(({ Linking }) => {
                    Linking.openSettings();
                  });
                }
              }}
            >
              <Text style={styles.permissionBtnText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: '#8A99AD', fontSize: 15 }}>No contacts found</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contacts</Text>
            </View>

            {filteredContacts.map(c => (
              <TouchableOpacity key={c.id} style={styles.contactCard} onPress={() => handleSelectContact(c)} activeOpacity={0.7}>
                <View style={[styles.avatarCircle, { backgroundColor: c.color }]}>
                  <Text style={styles.avatarText}>{c.initial}</Text>
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
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
  filtersArea: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#F7F9FC',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0A1F44',
    borderColor: '#0A1F44',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16,
    marginTop: -20,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 20, 
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  searchEmoji: {
    fontSize: 18,
    marginRight: 10,
    color: '#6B7280',
  },
  searchInput: { 
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  arrowButton: {
    backgroundColor: '#0A1F44',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginHorizontal: 16, 
    marginBottom: 12, 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#0A1F44' 
  },
  contactCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginVertical: 6, 
    padding: 16, 
    borderRadius: 20, 
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
  avatarText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  contactDetails: { 
    flex: 1 
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
  chevron: { 
    fontSize: 16, 
    color: '#9CA3AF', 
    fontWeight: 'bold' 
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  permissionEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#0A1F44',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
