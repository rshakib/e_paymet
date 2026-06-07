import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function BankTransferScreen() {
  const router = useRouter();

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
            <Text style={styles.headerTitle}>Bank Transfer</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.body}>
        <View style={styles.illustrationBg}>
          <Text style={styles.illustrationEmoji}>🏦</Text>
        </View>
        <Text style={styles.featureTitle}>Bank Transfer</Text>
        <Text style={styles.featureSub}>
          Transfer money securely from your NiroPay wallet to any local bank account. This feature is currently in test mode.
        </Text>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Upcoming Feature</Text>
        </View>
      </View>
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
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  illustrationBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#D0E3FF',
  },
  illustrationEmoji: { fontSize: 48 },
  featureTitle: { fontSize: 22, fontWeight: 'bold', color: '#0A1F44', marginBottom: 10 },
  featureSub: { fontSize: 14, color: '#8A99AD', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: { fontSize: 12, fontWeight: '700', color: '#64748B' }
});
