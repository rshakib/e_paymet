import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native'; 
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts/legacy';
import { authApiService } from '../../services/api';

export default function SendMoneyScreen() { 
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [matchedContacts, setMatchedContacts] = useState<any[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true);

  const handleManualVerify = async () => {
    if (!search.trim()) return;
    setValidating(true);
    setErrorMsg('');
    try {
      const res = await authApiService.checkReceiver(search.trim());
      if (res.success && res.data && res.data.username) {
        // Exists in database, proceed to amount screen!
        router.push({
          pathname: '/send/amount',
          params: { 
            name: res.data.full_name || res.data.username,
            phone: res.data.username,
            initial: (res.data.full_name || res.data.username).charAt(0).toUpperCase() || '👤',
            avatarColor: '#5C6BC0'
          }
        });
      } else {
        setErrorMsg(res.error || 'Recipient username not found in database.');
      }
    } catch (err) {
      setErrorMsg('Failed to validate recipient. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const initContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        if (data && data.length > 0) {
          const numberToContactMap: Record<string, any> = {};
          const phoneNumbers: string[] = [];

          data.forEach(c => {
            if (c.name && c.phoneNumbers && c.phoneNumbers.length > 0) {
              c.phoneNumbers.forEach(p => {
                if (p.number) {
                  const clean = p.number.replace(/[\s-]/g, '');
                  if (clean.length >= 10) {
                    numberToContactMap[clean] = c;
                    phoneNumbers.push(clean);
                  }
                }
              });
            }
          });

          if (phoneNumbers.length > 0) {
            const res = await authApiService.matchContacts(phoneNumbers);
            if (res.success && res.data && res.data.matched_users) {
              const colors = ['#5C6BC0', '#4CAF50', '#2196F3', '#FF9F1A', '#9C27B0', '#009688', '#E91E63'];
              const mapped = res.data.matched_users.map((u: any, idx: number) => {
                const localContact = numberToContactMap[u.mobile_number] || numberToContactMap[u.username] || {};
                const nameToShow = localContact.name || u.full_name || u.username;
                const color = colors[nameToShow.length % colors.length];
                
                return {
                  id: u.id || idx.toString(),
                  name: nameToShow,
                  phone: u.username,
                  initial: nameToShow.charAt(0).toUpperCase() || '👤',
                  color: color,
                  isNiroPayUser: true
                };
              });
              setMatchedContacts(mapped);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load contacts discovery:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    initContacts();
  }, []);

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
            const colors = ['#5C6BC0', '#4CAF50', '#2196F3', '#FF9F1A', '#9C27B0', '#009688', '#E91E63'];
            const color = colors[u.username.length % colors.length];
            return {
              id: u.id,
              name: u.full_name || u.username,
              phone: u.username,
              initial: (u.full_name || u.username).charAt(0).toUpperCase() || '👤',
              color: color
            };
          });
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to search recipients:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSelectContact = (contact: any) => {
    router.push({
      pathname: '/send/amount',
      params: { 
        name: contact.name,
        phone: contact.phone,
        initial: contact.initial,
        avatarColor: contact.color
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      <View style={styles.topHeaderContainer}>
        <View style={styles.header}>
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Send Money</Text>
              <TouchableOpacity onPress={() => router.push('/scan')} style={styles.qrButton}>
                <Image
                  source={require('../../../assets/qr.png')}
                  style={styles.headerQrIcon}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Floating Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput 
            placeholder="Search username or name in database" 
            placeholderTextColor="#999"
            style={styles.searchInput} 
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setErrorMsg('');
            }}
            onSubmitEditing={handleManualVerify}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {errorMsg.length > 0 && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {validating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#004BCE" />
            <Text style={styles.loadingText}>Validating recipient username...</Text>
          </View>
        )}

        {loadingContacts ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#004BCE" size="large" />
            <Text style={{ marginTop: 12, color: '#8A99AD' }}>Discovering NiroPay contacts...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionEmoji}>👥</Text>
            <Text style={styles.permissionTitle}>Contacts Permission Required</Text>
            <Text style={styles.permissionText}>
              Please allow NiroPay to access your contacts to discover registered users directly from your address book.
            </Text>
            <TouchableOpacity 
              style={styles.permissionBtn} 
              onPress={async () => {
                const { status } = await Contacts.requestPermissionsAsync();
                if (status === 'granted') {
                  setLoadingContacts(true);
                  initContacts();
                } else {
                  import('react-native').then(({ Linking }) => {
                    Linking.openSettings();
                  });
                }
              }}
            >
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Permission is granted, show dynamic contacts */
          search.trim().length === 0 ? (
            matchedContacts.length === 0 ? (
              <View style={styles.emptySearchContainer}>
                <Text style={styles.emptySearchEmoji}>👥</Text>
                <Text style={styles.emptySearchTitle}>No NiroPay Contacts</Text>
                <Text style={styles.emptySearchText}>
                  None of your device contacts are registered on NiroPay yet. Use search above to find other registered users.
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Registered Contacts</Text>
                </View>
                {matchedContacts.map(c => (
                  <TouchableOpacity key={c.id} style={styles.contactCard} onPress={() => handleSelectContact(c)} activeOpacity={0.7}>
                    <View style={[styles.avatarCircle, { backgroundColor: c.color }]}>
                      <Text style={styles.avatarText}>{c.initial}</Text>
                    </View>
                    <View style={styles.contactDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>NiroPay User</Text>
                        </View>
                      </View>
                      <Text style={styles.contactPhone}>@{c.phone}</Text>
                    </View>
                    <Text style={styles.chevron}>&gt;</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : (
            (() => {
              const filteredMatched = matchedContacts.filter(c => 
                c.name.toLowerCase().includes(search.toLowerCase()) || 
                c.phone.includes(search)
              );

              return (
                <View>
                  {/* Local Contacts Section */}
                  {filteredMatched.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Registered Contacts</Text>
                      </View>
                      {filteredMatched.map(c => (
                        <TouchableOpacity key={c.id} style={styles.contactCard} onPress={() => handleSelectContact(c)} activeOpacity={0.7}>
                          <View style={[styles.avatarCircle, { backgroundColor: c.color }]}>
                            <Text style={styles.avatarText}>{c.initial}</Text>
                          </View>
                          <View style={styles.contactDetails}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>NiroPay User</Text>
                              </View>
                            </View>
                            <Text style={styles.contactPhone}>@{c.phone}</Text>
                          </View>
                          <Text style={styles.chevron}>&gt;</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Global search loader */}
                  {searching ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <ActivityIndicator color="#004BCE" size="small" />
                      <Text style={{ marginTop: 8, color: '#8A99AD', fontSize: 13 }}>Searching database...</Text>
                    </View>
                  ) : (
                    /* Global Search Results Section */
                    (() => {
                      const filteredGlobal = searchResults.filter(
                        g => !filteredMatched.some(m => m.phone === g.phone)
                      );

                      if (filteredGlobal.length > 0) {
                        return (
                          <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                              <Text style={styles.sectionTitle}>Global Database Results</Text>
                            </View>
                            {filteredGlobal.map(c => (
                              <TouchableOpacity key={c.id} style={styles.contactCard} onPress={() => handleSelectContact(c)} activeOpacity={0.7}>
                                <View style={[styles.avatarCircle, { backgroundColor: c.color }]}>
                                  <Text style={styles.avatarText}>{c.initial}</Text>
                                </View>
                                <View style={styles.contactDetails}>
                                  <Text style={styles.contactName} numberOfLines={1}>{c.name}</Text>
                                  <Text style={styles.contactPhone}>@{c.phone}</Text>
                                </View>
                                <Text style={styles.chevron}>&gt;</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        );
                      }

                      if (filteredMatched.length === 0 && filteredGlobal.length === 0) {
                        return (
                          <View style={styles.emptySearchContainer}>
                            <Text style={styles.emptySearchEmoji}>📭</Text>
                            <Text style={styles.emptySearchTitle}>No User Found</Text>
                            <Text style={styles.emptySearchText}>
                              We couldn't find any registered accounts matching "{search.trim()}". Press Enter to validate directly.
                            </Text>
                          </View>
                        );
                      }
                      
                      return null;
                    })()
                  )}
                </View>
              );
            })()
          )
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
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 0,
    paddingBottom: 25,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerSafeArea: {
    width: '100%'
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
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
  qrButton: {
    padding: 8,
  },
  headerQrIcon: { 
    width: 22, 
    height: 22, 
    tintColor: '#FFFFFF',
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
  starFilled: {
    color: '#004BCE',
  },
  starOutline: {
    color: '#CCC',
  },
  chevron: { 
    fontSize: 16, 
    color: '#CCC', 
    fontWeight: 'bold' 
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptySearchEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#8A99AD',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
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
  badge: {
    backgroundColor: '#E7F9F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00C85320',
    marginLeft: 8,
  },
  badgeText: {
    color: '#00C853',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  permissionEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#0A1F44',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});