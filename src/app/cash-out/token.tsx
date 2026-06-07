import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function CashOutSuccessScreen() {
  const router = useRouter();

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
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, '0');

    return `${month} ${day}, ${year}  •  ${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Falling Confetti Particles matching cash.png */}
      <View style={[styles.confetti, { top: 80, left: 40, backgroundColor: '#27AE60', transform: [{ rotate: '15deg' }] }]} />
      <View style={[styles.confetti, { top: 120, right: 50, backgroundColor: '#FF9F1A', transform: [{ rotate: '-25deg' }] }]} />
      <View style={[styles.confetti, { top: 180, left: 90, backgroundColor: '#EB5757', transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.confetti, { top: 160, right: 110, backgroundColor: '#2F80ED', transform: [{ rotate: '10deg' }] }]} />
      <View style={[styles.confetti, { top: 250, left: 60, backgroundColor: '#9B51E0', transform: [{ rotate: '-15deg' }] }]} />
      <View style={[styles.confetti, { top: 280, right: 40, backgroundColor: '#27AE60', transform: [{ rotate: '30deg' }] }]} />

      <SafeAreaView style={styles.safeArea}>
        
        {/* Large White Circle with Blue Checkmark */}
        <View style={styles.circle}>
          <Text style={styles.tick}>✓</Text>
        </View>

        {/* Success Headers */}
        <Text style={styles.title}>{"Code Generated\nSuccessfully!"}</Text>
        <Text style={styles.sub}>Your temporary code has been generated. Please visit the bank within 5 minutes.</Text>

        {/* Detailed White Receipt Card */}
        <View style={styles.receiptCard}>
          <Text style={styles.summaryLabel}>Summary</Text>
          
          <View style={styles.horizontalDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Date & Time</Text>
            <Text style={styles.dateTimeText}>{getFormattedDateTime()}</Text>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Generated</Text>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Valid For</Text>
            <Text style={styles.rowValue}>5 Minutes</Text>
          </View>
        </View>

        {/* Action Buttons Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backHomeButton} 
            onPress={() => router.replace('/')} 
            activeOpacity={0.85}
          >
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.backHomeText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.makeAnotherButton} 
            onPress={() => router.replace('/cash-out')} 
            activeOpacity={0.85}
          >
            <Text style={styles.refreshIcon}>↻</Text>
            <Text style={styles.makeAnotherText}>Generate Again</Text>
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
    position: 'relative',
    justifyContent: 'center', 
    alignItems: 'center',
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
    lineHeight: 30,
    paddingHorizontal: 24,
  },
  sub: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
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
  summaryLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0A1F44',
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
  statusBadge: {
    backgroundColor: '#E7F9F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00C85320',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00C853',
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
    width: '90%',
    gap: 12,
    marginBottom: 16,
  },
  backHomeButton: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  homeIcon: {
    fontSize: 16,
    color: '#0A1F44',
    marginRight: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  makeAnotherText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
