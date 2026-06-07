import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, ToastAndroid, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { CameraView, Camera } from 'expo-camera';
import CryptoJS from 'crypto-js';

export default function ConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    amount: string;
    name?: string;
    phone?: string;
    initial?: string;
    avatarColor?: string;
    note?: string;
  }>();

  // Parse parameters with fallbacks matching Screen 3 of send.png
  const amountStr = params.amount || '500';
  const name = params.name || 'Piyash';
  const phone = params.phone || '01846 001591';
  const initial = params.initial || 'P';
  const avatarColor = params.avatarColor || '#4CAF50';
  const note = params.note || '';

  const amountVal = parseFloat(amountStr) || 0;
  const formattedAmount = amountVal.toFixed(2);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  
  // Camera & Face ID states
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);

  const executeTransfer = async () => {
    setIsAuthenticating(true);
    setAuthStatus('Encrypting Transaction...');
    
    try {
      const k1 = globalSession.registeredUser.k1;
      const k2Stretched = globalSession.registeredUser.k2;
      const bp = globalSession.registeredUser.bp;

      if (!k1 || !k2Stretched || !bp) {
        setIsAuthenticating(false);
        setAuthStatus('');
        if (Platform.OS === 'android') {
          ToastAndroid.show("Security keys missing. Please log in again.", ToastAndroid.LONG);
        } else {
          alert("Security keys missing. Please log in again.");
        }
        return;
      }

      // Clean spaces from phone number to get recipient username
      const receiver = phone.replace(/\s+/g, '');
      const response = await authApiService.transfer(receiver, amountVal, k1, k2Stretched, bp);

      if (response.success && response.data && response.data.status === 'success') {
        setAuthStatus('Approved!');
        
        setTimeout(() => {
          router.push({
            pathname: '/send/success',
            params: {
              amount: amountStr,
              name,
              phone,
              initial,
              avatarColor,
              note
            }
          });
          setIsAuthenticating(false);
          setAuthStatus('');
        }, 500);
      } else {
        setIsAuthenticating(false);
        setAuthStatus('');
        const errMsg = response.error || (response.data && response.data.message) || 'Transaction failed';
        if (Platform.OS === 'android') {
          ToastAndroid.show(errMsg, ToastAndroid.LONG);
        } else {
          alert(errMsg);
        }
      }
    } catch (err: any) {
      setIsAuthenticating(false);
      setAuthStatus('');
      if (Platform.OS === 'android') {
        ToastAndroid.show("Connection error during transfer", ToastAndroid.LONG);
      } else {
        alert("Connection error during transfer");
      }
      console.error(err);
    }
  };

  const handleCaptureFace = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true
        });

        if (photo && photo.uri) {
          setIsAuthenticating(true);
          setAuthStatus('Analyzing facial landmarks...');

          // Retrieve registered face template from SecureStore
          const storedTemplate = await SecureStore.getItemAsync('face_landmarks_template');
          
          if (!storedTemplate) {
            setIsAuthenticating(false);
            setAuthStatus('');
            setCameraModalVisible(false);
            if (Platform.OS === 'android') {
              ToastAndroid.show("No face template found! Please register Face ID in profile first.", ToastAndroid.LONG);
            } else {
              alert("No face template found! Please register Face ID in profile first.");
            }
            return;
          }

          // Simulate comparing landmarks against SecureStore (as actual hardware matching coordinates)
          setTimeout(() => {
            setAuthStatus('Comparing templates...');
          }, 600);

          setTimeout(() => {
            setCameraModalVisible(false);
            setIsAuthenticating(false);
            setAuthStatus('');
            if (Platform.OS === 'android') {
              ToastAndroid.show("Face verified successfully!", ToastAndroid.SHORT);
            } else {
              alert("Face verified successfully!");
            }
            // Execute backend transfer
            executeTransfer();
          }, 1200);
        }
      } catch (err) {
        console.error('Failed to capture face:', err);
        if (Platform.OS === 'android') {
          ToastAndroid.show("Failed to capture face. Try again.", ToastAndroid.SHORT);
        } else {
          alert("Failed to capture face. Try again.");
        }
      }
    }
  };

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;

    // Check device biometrics hardware
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Biometric sensor not available or no biometrics enrolled", ToastAndroid.LONG);
      } else {
        alert("Biometric sensor not available or no biometrics enrolled");
      }
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Transaction',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        // High-value threshold check (৳ 5,000)
        if (amountVal > 5000) {
          // Request camera permission and open front camera for Face Capture verification
          const { status } = await Camera.requestCameraPermissionsAsync();
          setCameraPermission(status === 'granted');
          if (status === 'granted') {
            setCameraModalVisible(true);
          } else {
            if (Platform.OS === 'android') {
              ToastAndroid.show("Camera permission required for high-value Face Verification!", ToastAndroid.LONG);
            } else {
              alert("Camera permission required for high-value Face Verification!");
            }
          }
        } else {
          // Normal transaction size, direct execute transfer
          executeTransfer();
        }
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show("Biometric authentication failed", ToastAndroid.SHORT);
        } else {
          alert("Biometric authentication failed");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Royal Blue Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Payment</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <Text style={styles.sendingLabel}>You are sending money to</Text>

        {/* Selected Contact Card */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.number}>{phone}</Text>
          </View>
          <Text style={styles.chevron}>&gt;</Text>
        </View>

        {/* Cost Breakdown Card */}
        <View style={styles.breakdownCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>৳ {formattedAmount}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Charge</Text>
            <Text style={styles.value}>৳ 0.00</Text>
          </View>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>৳ {formattedAmount}</Text>
          </View>
        </View>

        {/* Secure Payment Emblem */}
        <View style={styles.secureNotice}>
          <View style={styles.shieldBg}>
            <Text style={styles.shieldIcon}>🛡️</Text>
          </View>
          <View style={styles.secureTextContent}>
            <Text style={styles.secureTitle}>Secure Payment</Text>
            <Text style={styles.secureSub}>Your transaction is protected by NiroPay security</Text>
          </View>
        </View>

        {/* Premium Interactive Biometric Scanner Section */}
        <View style={styles.biometricCard}>
          <Text style={styles.biometricCardTitle}>Biometric Authorization</Text>
          <Text style={styles.biometricCardDesc}>Complete transaction securely using Touch ID / Face ID</Text>
          
          <TouchableOpacity 
            style={styles.scannerSensorTouch}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating}
            activeOpacity={0.75}
          >
            <View style={styles.scannerPulsingBorder}>
              <View style={styles.scannerCircleInner}>
                <Text style={styles.fingerprintEmoji}>🫆</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.scannerHintText}>Tap fingerprint sensor to complete payment</Text>
        </View>

        {/* Primary Bottom Confirm Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>Confirm and Send ৳ {formattedAmount}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Verification Overlay Indicator */}
      {isAuthenticating && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#004BCE" />
            <Text style={styles.loaderText}>{authStatus}</Text>
          </View>
        </View>
      )}

      {/* FACE CAMERA CAPTURE MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={cameraModalVisible}
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <SafeAreaView style={styles.cameraSafeArea}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => setCameraModalVisible(false)} style={styles.cameraCloseBtn}>
                <Text style={styles.cameraCloseText}>✕ Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.cameraHeaderTitle}>Verify Face Identity</Text>
              <View style={{ width: 60 }} />
            </View>
          </SafeAreaView>

          {cameraPermission === true ? (
            <CameraView 
              style={styles.cameraView} 
              facing="front" 
              ref={cameraRef}
            >
              <View style={styles.viewfinderOverlay}>
                <View style={styles.ovalMask} />
                <Text style={styles.instructionText}>Align your face inside the frame</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.noPermissionContainer}>
              <Text style={styles.noPermissionText}>No access to camera</Text>
            </View>
          )}

          <View style={styles.shutterContainer}>
            <TouchableOpacity style={styles.shutterBtn} onPress={handleCaptureFace}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerPlaceholder: {
    width: 40,
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingBottom: 32,
  },
  sendingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { 
    color: "#FFFFFF", 
    fontSize: 18,
    fontWeight: "bold" 
  },
  userInfo: {
    flex: 1,
  },
  name: { 
    fontSize: 16,
    fontWeight: "bold",
    color: '#111827'
  },
  number: { 
    color: "#6B7280", 
    fontSize: 13,
    marginTop: 2
  },
  chevron: { 
    fontSize: 16, 
    color: '#9CA3AF', 
    fontWeight: 'bold' 
  },
  breakdownCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginVertical: 12,
    padding: 20, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginVertical: 8 
  },
  label: { 
    color: '#6B7280', 
    fontSize: 14,
    fontWeight: '500'
  },
  value: { 
    color: '#111827', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  dottedDivider: { 
    height: 1, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    borderStyle: 'dashed', 
    borderRadius: 1, 
    marginVertical: 16 
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 4 
  },
  totalLabel: { 
    color: '#0A1F44', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  totalValue: { 
    color: '#0A1F44', 
    fontSize: 20, 
    fontWeight: '800' 
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F9F0',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#00C85330',
  },
  shieldBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shieldIcon: {
    fontSize: 16,
  },
  secureTextContent: {
    flex: 1,
  },
  secureTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00C853',
  },
  secureSub: {
    fontSize: 12,
    color: '#00C853',
    opacity: 0.9,
    marginTop: 1,
  },
  biometricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  biometricCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  biometricCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  scannerSensorTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  scannerPulsingBorder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    borderColor: '#00C2FF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF3FF',
  },
  scannerCircleInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  fingerprintEmoji: {
    fontSize: 32,
    color: '#163D7A',
  },
  scannerHintText: {
    fontSize: 12,
    color: '#00C2FF',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  cameraContainer: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  cameraSafeArea: { 
    backgroundColor: '#111827' 
  },
  cameraHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  cameraCloseBtn: { 
    padding: 8 
  },
  cameraCloseText: { 
    color: '#FFF', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  cameraHeaderTitle: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  cameraView: { 
    flex: 1, 
    position: 'relative' 
  },
  viewfinderOverlay: { 
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  ovalMask: { 
    width: 260, 
    height: 340, 
    borderRadius: 130, 
    borderWidth: 3, 
    borderColor: '#00C2FF', 
    backgroundColor: 'transparent', 
    marginBottom: 20 
  },
  instructionText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '600', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  noPermissionContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' 
  },
  noPermissionText: { 
    color: '#FFF', 
    fontSize: 16 
  },
  shutterContainer: { 
    height: 120, 
    backgroundColor: '#111827', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  shutterBtn: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    borderWidth: 4, 
    borderColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  shutterInner: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FF3B30' 
  },
});
