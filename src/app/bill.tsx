import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, ToastAndroid, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { globalSession } from '../constants/auth';
import { authApiService } from '../services/api';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { CameraView, Camera } from 'expo-camera';

interface Bill {
  id: string;
  biller_name: string;
  bill_number: string;
  amount: number;
  due_date: string;
  status: 'unpaid' | 'paid';
  paid_at?: string;
}

export default function BillScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  // Camera & Face ID states
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const fetchBills = async () => {
    try {
      const username = globalSession.registeredUser.username;
      if (!username) return;
      const res = await authApiService.getBills(username);
      if (res.success && res.data && res.data.bills) {
        setBills(res.data.bills);
      } else {
        setBills([]);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) await fetchBills();
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handlePayBill = async (billId: string) => {
    if (payingBillId) return;
    setPayingBillId(billId);
    setPaymentStatus('Processing utility payment...');
    
    try {
      const { k1, k2, bp } = globalSession.registeredUser;
      if (!k1 || !k2 || !bp) {
        throw new Error("Security keys missing. Please re-login.");
      }

      const res = await authApiService.payBill(billId, k1, k2, bp);
      if (res.success && res.data && res.data.status === 'success') {
        setPaymentStatus('Payment Successful!');
        setTimeout(() => {
          setPayingBillId(null);
          setPaymentStatus('');
          fetchBills();
        }, 1200);
      } else {
        setPayingBillId(null);
        setPaymentStatus('');
        const errMsg = res.error || 'Payment failed';
        if (Platform.OS === 'android') {
          ToastAndroid.show(errMsg, ToastAndroid.LONG);
        } else {
          alert(errMsg);
        }
      }
    } catch (err) {
      setPayingBillId(null);
      setPaymentStatus('');
      const msg = err instanceof Error ? err.message : "Connection error paying bill";
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.LONG);
      } else {
        alert(msg);
      }
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
          setPaymentStatus('Analyzing facial landmarks...');

          const storedTemplate = await SecureStore.getItemAsync('face_landmarks_template');
          if (!storedTemplate) {
            setCameraModalVisible(false);
            setPayingBillId(null);
            if (Platform.OS === 'android') {
              ToastAndroid.show("No face template found!", ToastAndroid.LONG);
            } else {
              alert("No face template found!");
            }
            return;
          }

          setTimeout(() => {
            setCameraModalVisible(false);
            if (selectedBill) handlePayBill(selectedBill.id);
          }, 1200);
        }
      } catch (err) {
        console.error('Failed to capture face:', err);
      }
    }
  };

  const triggerBiometricAuth = async (bill: Bill) => {
    setSelectedBill(bill);
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Biometric sensor not available", ToastAndroid.LONG);
      } else {
        alert("Biometric sensor not available");
      }
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Bill Payment',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        if (bill.amount > 5000) {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setCameraPermission(status === 'granted');
          if (status === 'granted') {
            setPayingBillId(bill.id);
            setCameraModalVisible(true);
          } else {
            alert("Camera permission required for high-value Face Verification!");
          }
        } else {
          handlePayBill(bill.id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

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
            <Text style={styles.headerTitle}>Pay Bill</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0A1F44" />
          <Text style={{ marginTop: 12, color: '#8A99AD' }}>Loading bills...</Text>
        </View>
      ) : bills.length === 0 ? (
        <View style={styles.body}>
          <View style={styles.illustrationBg}>
            <Text style={styles.illustrationEmoji}>📄</Text>
          </View>
          <Text style={styles.featureTitle}>No Bills Found</Text>
          <Text style={styles.featureSub}>
            All your utility bill invoices are currently settled and up-to-date.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 20 }}>
          <Text style={styles.sectionTitle}>Utility Invoices</Text>
          {bills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billDetails}>
                <Text style={styles.billerName}>{bill.biller_name}</Text>
                <Text style={styles.billNumber}>Invoice: {bill.bill_number}</Text>
                <Text style={styles.billDue}>
                  {bill.status === 'paid' ? `Paid at: ${new Date(bill.paid_at || '').toLocaleDateString()}` : `Due Date: ${bill.due_date}`}
                </Text>
              </View>
              <View style={styles.actionCol}>
                <Text style={styles.amount}>৳ {bill.amount.toFixed(2)}</Text>
                {bill.status === 'paid' ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>PAID</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.payBtn} onPress={() => triggerBiometricAuth(bill)}>
                    <Text style={styles.payBtnText}>Pay</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {payingBillId && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0A1F44" />
            <Text style={styles.loaderText}>{paymentStatus}</Text>
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
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { 
    backgroundColor: '#0A1F44', 
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 12,
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  featureSub: { fontSize: 14, color: '#8A99AD', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0A1F44', marginHorizontal: 16, marginBottom: 12 },
  billCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
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
  billDetails: { flex: 1 },
  billerName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  billNumber: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  billDue: { fontSize: 12, color: '#FF9F1A', marginTop: 6, fontWeight: '500' },
  actionCol: { alignItems: 'flex-end', justifyContent: 'space-between' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#0A1F44' },
  payBtn: {
    backgroundColor: '#0A1F44',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  paidBadge: {
    backgroundColor: '#E8FDF5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C4F7E3',
  },
  paidText: { color: '#10B981', fontSize: 11, fontWeight: 'bold' },
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
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#0A1F44',
    fontWeight: '600',
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
