import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    amount: string;
    name?: string;
    phone?: string;
    initial?: string;
    avatarColor?: string;
    note?: string;
  }>();

  // Parse parameters with fallbacks matching Screen 4 of send.png
  const amountStr = params.amount || '500';
  const name = params.name || 'Piyash';
  const phone = params.phone || '01846 001591';
  const initial = params.initial || 'P';
  const avatarColor = params.avatarColor || '#4CAF50';

  const amountVal = parseFloat(amountStr) || 0;
  const formattedAmount = amountVal.toFixed(2);

  // Generate dynamic date & time in "May 15, 2024 • 09:41 AM" format
  const getFormattedDateTime = () => {
    const date = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'AM' : 'PM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedHours = hours.toString().padStart(2, '0');

    return `${month} ${day}, ${year}  •  ${formattedHours}:${minutes} ${ampm}`;
  };

  const txId = 'NPR' + Math.floor(1000000000 + Math.random() * 9000000000);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Confetti Decorative Background Elements */}
      <View style={[styles.confetti, { top: 60, left: 40, backgroundColor: '#27AE60', transform: [{ rotate: '15deg' }] }]} />
      <View style={[styles.confetti, { top: 90, right: 60, backgroundColor: '#F2C94C', transform: [{ rotate: '-25deg' }] }]} />
      <View style={[styles.confetti, { top: 150, left: 90, backgroundColor: '#EB5757', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.confetti, { top: 130, right: 110, backgroundColor: '#2F80ED', transform: [{ rotate: '10deg' }] }]} />
      <View style={[styles.confetti, { top: 220, left: 50, backgroundColor: '#9B51E0', transform: [{ rotate: '-15deg' }] }]} />
      <View style={[styles.confetti, { top: 250, right: 40, backgroundColor: '#27AE60', transform: [{ rotate: '30deg' }] }]} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* Success Header Badge */}
        <View style={styles.circle}>
          <Text style={styles.tick}>✓</Text>
        </View>

        <Text style={styles.title}>Money Sent Successfully!</Text>
        <Text style={styles.sub}>Your payment has been sent</Text>

        {/* Detailed White Receipt Card */}
        <View style={styles.receiptCard}>
          
          {/* Recipient Header Info */}
          <View style={styles.recipientHeader}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{name}</Text>
              <Text style={styles.recipientPhone}>{phone}</Text>
            </View>
          </View>

          {/* Value Breakdown Details */}
          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Amount</Text>
            <Text style={styles.rowValue}>৳ {formattedAmount}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Charge</Text>
            <Text style={styles.rowValue}>৳ 0.00</Text>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>৳ {formattedAmount}</Text>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Transaction ID</Text>
            <Text style={styles.txIdText}>{txId}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Date & Time</Text>
            <Text style={styles.dateTimeText}>{getFormattedDateTime()}</Text>
          </View>

        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backHomeButton} 
            onPress={() => router.replace('/')} 
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A1F44', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 16,
    borderRadius: 2,
    opacity: 0.85,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  tick: { 
    fontSize: 44, 
    color: '#00C853',
    fontWeight: 'bold',
  },
  title: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  sub: { 
    color: '#9CA3AF', 
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#111827',
  },
  recipientPhone: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 'bold',
  },
  horizontalDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 12,
  },
  totalLabel: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 15,
  },
  totalValue: {
    color: '#0A1F44',
    fontWeight: 'bold',
    fontSize: 18,
  },
  txIdText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 'bold',
  },
  dateTimeText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '90%',
    gap: 12,
    marginBottom: 16,
  },
  viewDetailsButton: {
    backgroundColor: '#163D7A',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backHomeButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
