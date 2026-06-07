import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';

export default function VerifyIdentityScreen() {
  const router = useRouter();
  
  // Security Layer States
  const [pin, setPin] = useState('');
  const [activeStage, setActiveStage] = useState<'PIN' | 'Fingerprint' | 'Face' | 'Completed'>('PIN');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');

  // Keypad Actions for PIN Entry
  const addPinDigit = (digit: string) => {
    if (activeStage !== 'PIN') return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto transition when 4 digits are completed
      if (newPin.length === 4) {
        setIsVerifying(true);
        setVerifyStatus('Verifying secure PIN...');
        setTimeout(() => {
          setIsVerifying(false);
          setActiveStage('Fingerprint');
          setVerifyStatus('');
        }, 1200);
      }
    }
  };

  const deletePinDigit = () => {
    if (activeStage !== 'PIN') return;
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Fingerprint Scan Action
  const triggerFingerprintScan = () => {
    if (activeStage !== 'Fingerprint' || isVerifying) return;
    
    setIsVerifying(true);
    setVerifyStatus('Scanning Fingerprint...');
    
    setTimeout(() => {
      setVerifyStatus('Verifying fingerprint patterns...');
    }, 600);

    setTimeout(() => {
      setIsVerifying(false);
      setActiveStage('Face');
      setVerifyStatus('');
    }, 1500);
  };

  // Face Scan Action
  const triggerFaceScan = () => {
    if (activeStage !== 'Face' || isVerifying) return;
    
    setIsVerifying(true);
    setVerifyStatus('Initializing Face Camera...');
    
    setTimeout(() => {
      setVerifyStatus('Scanning facial geometry...');
    }, 500);

    setTimeout(() => {
      setVerifyStatus('Matching details with bank...');
    }, 1000);

    setTimeout(() => {
      setIsVerifying(false);
      setActiveStage('Completed');
      setVerifyStatus('');
    }, 1800);
  };

  // Final Action to Proceed
  const handleFinalSubmit = () => {
    if (activeStage !== 'Completed') return;
    
    setIsVerifying(true);
    setVerifyStatus('Authorizing transaction...');
    
    setTimeout(() => {
      router.push({
        pathname: '/cash-out/confirm',
        params: {
          amount: '5000',
          name: 'Dhaka Bank ATM',
          details: 'Mirpur 10, Block B',
          initial: '🏦',
          color: '#004BCE',
          bgColor: '#EBF3FF',
          isAtm: 'true',
        }
      });
      setIsVerifying(false);
      setPin('');
      setActiveStage('PIN');
    }, 1000);
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
            <Text style={styles.headerTitle}>Verify Identity</Text>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🦅</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Requester Profile Card */}
        <View style={styles.requesterCard}>
          <Text style={styles.requestLabel}>You are requesting cash out</Text>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Shakib Hasan</Text>
              <Text style={styles.userPhone}>01712 345 678</Text>
            </View>
          </View>
        </View>

        {/* 3-Factor Checklist Indicators */}
        <View style={styles.mfaStatusCard}>
          <Text style={styles.mfaTitle}>Multi-Factor Verification Required</Text>
          <View style={styles.mfaStepRow}>
            {/* Step 1: PIN */}
            <View style={styles.stepColumn}>
              <View style={[
                styles.stepCircle, 
                activeStage !== 'PIN' && styles.stepCircleCompleted,
                activeStage === 'PIN' && styles.stepCircleActive
              ]}>
                <Text style={styles.stepCircleText}>
                  {activeStage !== 'PIN' ? '✓' : '1'}
                </Text>
              </View>
              <Text style={[styles.stepLabel, activeStage === 'PIN' && styles.stepLabelActive]}>1. PIN Code</Text>
            </View>
            
            <View style={styles.stepConnector} />
            
            {/* Step 2: Fingerprint */}
            <View style={styles.stepColumn}>
              <View style={[
                styles.stepCircle,
                (activeStage === 'Face' || activeStage === 'Completed') && styles.stepCircleCompleted,
                activeStage === 'Fingerprint' && styles.stepCircleActive
              ]}>
                <Text style={styles.stepCircleText}>
                  {(activeStage === 'Face' || activeStage === 'Completed') ? '✓' : '2'}
                </Text>
              </View>
              <Text style={[styles.stepLabel, activeStage === 'Fingerprint' && styles.stepLabelActive]}>2. Fingerprint</Text>
            </View>

            <View style={styles.stepConnector} />

            {/* Step 3: Face ID */}
            <View style={styles.stepColumn}>
              <View style={[
                styles.stepCircle,
                activeStage === 'Completed' && styles.stepCircleCompleted,
                activeStage === 'Face' && styles.stepCircleActive
              ]}>
                <Text style={styles.stepCircleText}>
                  {activeStage === 'Completed' ? '✓' : '3'}
                </Text>
              </View>
              <Text style={[styles.stepLabel, activeStage === 'Face' && styles.stepLabelActive]}>3. Face Scan</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Display based on active security stage */}
        
        {/* Stage 1: PIN CODE */}
        {activeStage === 'PIN' && (
          <View style={styles.stageContainer}>
            <Text style={styles.verifyPrompt}>Enter your 4-digit PIN</Text>
            <View style={styles.dotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    pin.length > index ? styles.dotFilled : styles.dotHollow
                  ]} 
                />
              ))}
            </View>

            {/* Custom Numeric Keypad for PIN entry */}
            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('1')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('2')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('3')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>3</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('4')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('5')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>5</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('6')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>6</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('7')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>7</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('8')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>8</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('9')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>9</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keypadRow}>
                <View style={styles.emptyKey} />
                <TouchableOpacity style={styles.key} onPress={() => addPinDigit('0')} activeOpacity={0.6}>
                  <Text style={styles.keyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.key} onPress={deletePinDigit} activeOpacity={0.6}>
                  <Text style={styles.deleteText}>⌫</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Stage 2: FINGERPRINT SCAN */}
        {activeStage === 'Fingerprint' && (
          <View style={styles.stageContainer}>
            <Text style={styles.verifyPrompt}>Please scan your fingerprint</Text>
            <View style={styles.scannerWrapper}>
              <TouchableOpacity 
                style={styles.scannerTouch}
                onPress={triggerFingerprintScan}
                activeOpacity={0.8}
              >
                <View style={styles.pulsingRingOuter}>
                  <View style={styles.pulsingRingInner}>
                    <View style={styles.fingerprintCircle}>
                      <Text style={styles.fingerprintEmoji}>🫆</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.fingerprintLink}>Tap Fingerprint Sensor to Verify</Text>
            </View>
          </View>
        )}

        {/* Stage 3: FACE SCAN */}
        {activeStage === 'Face' && (
          <View style={styles.stageContainer}>
            <Text style={styles.verifyPrompt}>Please complete Face Authentication</Text>
            <View style={styles.scannerWrapper}>
              <TouchableOpacity 
                style={styles.scannerTouch}
                onPress={triggerFaceScan}
                activeOpacity={0.8}
              >
                <View style={[styles.pulsingRingOuter, { backgroundColor: '#F0F9FF' }]}>
                  <View style={[styles.pulsingRingInner, { backgroundColor: '#E0F2FE' }]}>
                    <View style={styles.fingerprintCircle}>
                      <Text style={styles.fingerprintEmoji}>👤</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={[styles.fingerprintLink, { color: '#0284C7' }]}>Tap Face Sensor to Scan</Text>
            </View>
          </View>
        )}

        {/* Stage 4: COMPLETED ALL Layer Verification */}
        {activeStage === 'Completed' && (
          <View style={styles.stageContainer}>
            <View style={styles.successBox}>
              <View style={styles.successBadgeCircle}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.successTitleText}>All Security Checks Passed!</Text>
              <Text style={styles.successDescText}>
                PIN, Fingerprint, and Face scans successfully verified by secure multi-factor authentication.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.verifyButton, activeStage !== 'Completed' && styles.verifyButtonInactive]}
          onPress={handleFinalSubmit}
          disabled={activeStage !== 'Completed'}
          activeOpacity={0.85}
        >
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>

      {/* Verification Overlay Indicator */}
      {isVerifying && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0A1F44" />
            <Text style={styles.loaderText}>{verifyStatus}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F7F9FC" 
  },
  header: { 
    backgroundColor: "#0A1F44", 
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
    paddingBottom: 110,
  },
  requesterCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
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
  requestLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  mfaStatusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  mfaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A1F44',
    textAlign: 'center',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mfaStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepColumn: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#0A1F44',
  },
  stepCircleCompleted: {
    backgroundColor: '#00C853',
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0A1F44',
    fontWeight: 'bold',
  },
  stepConnector: {
    height: 2,
    backgroundColor: '#E2E8F0',
    flex: 0.5,
    marginTop: -22,
  },
  stageContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  verifyPrompt: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  scannerWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scannerTouch: {
    marginBottom: 12,
  },
  pulsingRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingRingInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fingerprintCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  fingerprintEmoji: {
    fontSize: 36,
    color: '#163D7A',
  },
  fingerprintLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00C2FF',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 15,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotFilled: {
    backgroundColor: '#0A1F44',
  },
  dotHollow: {
    borderWidth: 2,
    borderColor: '#0A1F44',
    backgroundColor: 'transparent',
  },
  keypad: {
    paddingHorizontal: 40,
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  key: {
    width: 70,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyKey: {
    width: 70,
    height: 44,
  },
  keyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  deleteText: {
    fontSize: 22,
    color: '#0A1F44',
  },
  successBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#E7F9F0',
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00C85330',
  },
  successBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
  },
  successCheck: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  verifyButtonInactive: {
    backgroundColor: '#CBD5E1',
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotBtn: {
    paddingVertical: 4,
  },
  forgotText: {
    color: '#163D7A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 31, 68, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderBox: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  loaderText: {
    fontSize: 14,
    color: '#0A1F44',
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
});
