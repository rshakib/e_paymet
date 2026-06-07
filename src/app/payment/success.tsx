import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    amount: string;
    name?: string;
    phone?: string;
    color?: string;
    bgColor?: string;
    initial?: string;
  }>();

  const amountStr = params.amount || '1.00';
  const name = params.name || 'Nadir Optics';
  const phone = params.phone || '01712924659';
  const color = params.color || '#2F80ED';
  const bgColor = params.bgColor || '#EBF3FF';
  const initial = params.initial || '🛍️';

  const amountVal = parseFloat(amountStr) || 0;
  const formattedAmount = amountVal.toFixed(2);

  // Generate dynamic date & time matching the "May 15, 2024 • 09:41 AM" format
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

  // Dynamically generated transaction ID to avoid hardcoded placeholders
  const txId = 'NPR' + Math.floor(1000000000 + Math.random() * 9000000000);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Decorative Rotating Diamond Confetti Particles */}
      <View style={[styles.confetti, { top: 70, left: 50, backgroundColor: '#27AE60', transform: [{ rotate: '15deg' }] }]} />
      <View style={[styles.confetti, { top: 100, right: 60, backgroundColor: '#FF9F1A', transform: [{ rotate: '-25deg' }] }]} />
      <View style={[styles.confetti, { top: 160, left: 100, backgroundColor: '#EB5757', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.confetti, { top: 140, right: 120, backgroundColor: '#2F80ED', transform: [{ rotate: '10deg' }] }]} />
      <View style={[styles.confetti, { top: 230, left: 60, backgroundColor: '#9B51E0', transform: [{ rotate: '-15deg' }] }]} />
      <View style={[styles.confetti, { top: 260, right: 50, backgroundColor: '#27AE60', transform: [{ rotate: '30deg' }] }]} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* Success Circle Header */}
        <View style={styles.circle}>
          <Text style={styles.tick}>✓</Text>
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.sub}>Your payment has been completed.</Text>

        {/* Detailed White Receipt Card */}
        <View style={styles.receiptCard}>
          
          {/* Recipient Card Details */}
          <View style={styles.recipientHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: bgColor }]}>
              <Text style={[styles.avatarIcon, { color: color }]}>{initial}</Text>
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{name}</Text>
              <Text style={styles.recipientPhone}>{phone}</Text>
            </View>
          </View>

          {/* Receipt Items Breakdown */}
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
            <Text style={styles.backHomeText}>🏠  Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.makeAnotherButton} 
            onPress={() => router.replace('/payment')} 
            activeOpacity={0.8}
          >
            <Text style={styles.makeAnotherText}>↻  Make Another Payment</Text>
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
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
    color: '#00C853',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  sub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 18,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  recipientPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  txIdText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 13,
    color: '#111827',
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
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  backHomeButton: {
    backgroundColor: '#FFFFFF',
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
  backHomeText: {
    color: '#0A1F44',
    fontSize: 16,
    fontWeight: 'bold',
  },
  makeAnotherButton: {
    backgroundColor: 'transparent',
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  makeAnotherText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
