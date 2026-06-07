import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ToastAndroid, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function CashOutCodeScreen() {
  const router = useRouter();

  // Timer & Code State
  const [timeLeft, setTimeLeft] = useState(299); // Start at 04:59 (299 seconds)
  const [tokenCode, setTokenCode] = useState('847 293');
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleRegenerate = () => {
    // Generate new random 6-digit token styled as XXX XXX
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    setTokenCode(`${rand.slice(0, 3)} ${rand.slice(3)}`);
    setTimeLeft(300); // 5:00
  };

  const handleCopyCode = () => {
    // Copy logic
    if (Platform.OS === 'android') {
      ToastAndroid.show('Code copied to clipboard!', ToastAndroid.SHORT);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifySuccess = () => {
    // Trigger navigation to success Screen 4
    router.push({
      pathname: '/cash-out/token',
      params: {
        code: tokenCode,
        time: formatTime(timeLeft),
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Header matching cash.png */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cash Out Code</Text>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🦅</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Verification Check Shield */}
        <View style={styles.shieldContainer}>
          <View style={styles.checkCircle}>
            <View style={styles.shield}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        </View>

        {/* Text Label */}
        <Text style={styles.codeLabel}>Your Cash Out Code</Text>

        {/* Giant Monospace Code Card */}
        <TouchableOpacity 
          style={styles.codeCard}
          onPress={handleVerifySuccess} // Clicking the code card directly acts as a transition trigger to success!
          activeOpacity={0.9}
        >
          <Text style={[styles.codeText, isExpired && styles.codeTextExpired]}>
            {isExpired ? 'EXPIRED' : tokenCode}
          </Text>
        </TouchableOpacity>

        {/* Valid For Countdown Indicator */}
        <View style={styles.timerSection}>
          <Text style={styles.validForText}>Valid for</Text>
          <View style={styles.progressCircle}>
            <Text style={styles.timerText}>{isExpired ? '00:00' : formatTime(timeLeft)}</Text>
          </View>
        </View>

        {/* Warning Information callout box */}
        <View style={styles.infoCalloutCard}>
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>i</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Please show this code to a bank officer to complete your cash out.
            </Text>
            <Text style={styles.infoSubtext}>
              Do not share this code with anyone.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={handleCopyCode}
          activeOpacity={0.85}
        >
          <Text style={styles.copyIcon}>📋</Text>
          <Text style={styles.copyButtonText}>Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.regenerateButton, !isExpired && styles.regenerateButtonDisabled]}
          onPress={handleRegenerate}
          disabled={!isExpired}
          activeOpacity={0.85}
        >
          <Text style={[styles.regenerateIcon, !isExpired && styles.regenerateIconDisabled]}>🔄</Text>
          <Text style={[styles.regenerateButtonText, !isExpired && styles.regenerateButtonTextDisabled]}>
            {isExpired ? 'Regenerate Code' : `Regenerate in ${formatTime(timeLeft)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeIconBtn}>🏠</Text>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F7F9FC' 
  },
  header: { 
    backgroundColor: '#0A1F44', 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 16,
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
  logoContainer: {
    padding: 8,
  },
  logoText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: 240,
    alignItems: 'center',
  },
  shieldContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  shield: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    width: '90%',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0A1F44',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  codeTextExpired: {
    color: '#D32F2F',
    letterSpacing: 0,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  validForText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: '#FFB300',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFB300',
  },
  infoCalloutCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    width: '90%',
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  infoIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#163D7A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 13,
    color: '#0A1F44',
    lineHeight: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  copyButton: {
    backgroundColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  copyIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regenerateButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0A1F44',
    borderWidth: 1.5,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateButtonDisabled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    opacity: 0.75,
  },
  regenerateIcon: {
    fontSize: 16,
    color: '#0A1F44',
    marginRight: 8,
  },
  regenerateIconDisabled: {
    color: '#CBD5E1',
  },
  regenerateButtonText: {
    color: '#0A1F44',
    fontSize: 16,
    fontWeight: 'bold',
  },
  regenerateButtonTextDisabled: {
    color: '#CBD5E1',
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderColor: '#0A1F44',
    borderWidth: 1.5,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  homeIconBtn: {
    fontSize: 16,
    color: '#0A1F44',
    marginRight: 8,
  },
  homeButtonText: {
    color: '#0A1F44',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
