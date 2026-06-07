import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform, ToastAndroid, ActivityIndicator } from 'react-native'; 
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { authApiService } from '../../services/api';
import { globalSession } from '../../constants/auth';

export default function ScanIndexScreen() { 
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Scan' | 'MyQR'>('Scan');
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);
  const [torch, setTorch] = useState(false);

  // Dynamic User Info for My QR
  const user = globalSession.registeredUser;
  const qrPayload = useMemo(() => {
    return `niropay://pay?phone=${user.username}`;
  }, [user.username]);

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrPayload)}&color=0A1F44&bgcolor=F7F9FC`;
  }, [qrPayload]);

  // Parse QR Payload: niropay://pay?phone=<merchant_phone>
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isVerifying) return;
    setScanned(true);

    try {
      console.log("[SCAN] Scanned Payload:", data);
      
      let phone = '';
      if (data.startsWith('niropay://pay?phone=')) {
        phone = data.split('phone=')[1];
      } else {
        throw new Error("Invalid NiroPay QR Code");
      }

      if (!phone) throw new Error("Could not extract phone number");

      // Verify Merchant/User (Resolution 4C)
      setIsVerifying(true);
      const res = await authApiService.checkReceiver(phone);
      setIsVerifying(false);

      if (res.success && res.data) {
        router.push({
          pathname: '/scan/result',
          params: { 
            name: res.data.full_name || 'NiroPay User',
            phone: res.data.username,
            role: res.data.role || 'user',
            color: '#0A1F44',
            bgColor: '#EBF3FF',
            initial: (res.data.full_name || 'U').substring(0, 1).toUpperCase()
          }
        });
      } else {
        throw new Error(res.error || "User not found on NiroPay");
      }

    } catch (err: any) {
      setIsVerifying(false);
      const msg = err.message || "Invalid QR Code";
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.LONG);
      } else {
        alert(msg);
      }
      // Allow re-scan after a short delay on error
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR</Text>
            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <Text style={styles.helpText}>?</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Segmented Tab Control */}
      <View style={styles.tabsContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Scan' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('Scan')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'Scan' && styles.tabTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'MyQR' && styles.tabButtonActive]} 
            onPress={() => setActiveTab('MyQR')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'MyQR' && styles.tabTextActive]}>My QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Viewport ScrollArea */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {activeTab === 'Scan' ? (
          <>
            <Text style={styles.viewfinderInstructions}>Align QR code within the frame</Text>

            {/* Viewfinder Scanning Box */}
            <View style={styles.viewfinderContainer}>
              {Platform.OS === 'web' ? (
                <View style={styles.webMessageContainer}>
                  <Text style={styles.webMessageText}>Camera scanning is only available on mobile devices.</Text>
                  <Text style={styles.webSubText}>Please use the NiroPay mobile app to scan QR codes.</Text>
                </View>
              ) : !permission.granted ? (
                <View style={styles.webMessageContainer}>
                  <Text style={styles.webMessageText}>Camera access required</Text>
                  <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                    <Text style={styles.grantBtnText}>Grant Permission</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  enableTorch={torch}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              )}

              {/* Glowing view corners */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Glowing scan horizontal line */}
              <View style={styles.scanLine} />

              {/* Loader Overlay when verifying merchant */}
              {isVerifying && (
                <View style={styles.scannerLoader}>
                  <ActivityIndicator size="large" color="#00C2FF" />
                  <Text style={styles.loaderText}>Verifying Merchant...</Text>
                </View>
              )}

              {/* Viewfinder Actions overlay at bottom */}
              <View style={styles.viewfinderFooter}>
                <TouchableOpacity 
                  style={styles.viewfinderActionBtn} 
                  activeOpacity={0.7}
                  onPress={() => setTorch(!torch)}
                >
                  <Text style={styles.actionEmoji}>{torch ? '🔦' : '⚡'}</Text>
                  <Text style={styles.actionLabel}>{torch ? 'Off' : 'Flash'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.viewfinderActionBtn} activeOpacity={0.7}>
                  <Text style={styles.actionEmoji}>🖼️</Text>
                  <Text style={styles.actionLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Guide Guidelines details card */}
            <View style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <Text style={styles.guideHeaderIcon}>🛈</Text>
                <Text style={styles.guideHeaderTitle}>How it works?</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideBadge}><Text style={styles.guideBadgeText}>1</Text></View>
                <Text style={styles.guideText}>Scan QR code</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideBadge}><Text style={styles.guideBadgeText}>2</Text></View>
                <Text style={styles.guideText}>Enter amount (if needed)</Text>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideBadge}><Text style={styles.guideBadgeText}>3</Text></View>
                <Text style={styles.guideText}>Confirm payment securely</Text>
              </View>
            </View>
          </>
        ) : (
          /* Personal QR Profile Card (4A) */
          <View style={styles.myQrCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {(user.fullName || 'U').substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.fullName || 'NiroPay User'}</Text>
                <Text style={styles.profileRole}>Personal Account</Text>
                <Text style={styles.profilePhone}>{user.username || '---'}</Text>
              </View>
            </View>

            <View style={styles.qrImageContainer}>
              {user.username ? (
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.personalQrImage}
                />
              ) : (
                <View style={styles.qrLoadingPlaceholder}>
                  <ActivityIndicator color="#0A1F44" />
                </View>
              )}
            </View>

            <Text style={styles.qrCaption}>Scan this QR code to send money to my account</Text>

            <View style={styles.qrActionsRow}>
              <TouchableOpacity style={styles.qrShareBtn} activeOpacity={0.7}>
                <Text style={styles.qrShareBtnText}>📤  Share QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrDownloadBtn} activeOpacity={0.7}>
                <Text style={styles.qrDownloadBtnText}>💾  Save Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom space */}
        <View style={{ height: 30 }} />
      </ScrollView>
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
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 4,
    height: 48,
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: '#0A1F44',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  viewfinderInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  viewfinderContainer: {
    backgroundColor: '#070D19',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    position: 'relative',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: '#00C2FF',
    borderWidth: 4,
    zIndex: 10,
  },
  topLeft: {
    top: 25,
    left: 25,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 25,
    right: 25,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 80,
    left: 25,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 80,
    right: 25,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 4,
    backgroundColor: '#00C2FF',
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
    top: '35%',
  },
  mockQrCodeImage: {
    width: 140,
    height: 140,
    tintColor: '#E2E8F0',
    opacity: 0.8,
    marginBottom: 40,
  },
  viewfinderFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  viewfinderActionBtn: {
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideHeaderIcon: {
    fontSize: 16,
    color: '#163D7A',
    marginRight: 8,
    fontWeight: 'bold',
  },
  guideHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  guideBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#163D7A',
  },
  scannerLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 13, 25, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loaderText: {
    color: '#00C2FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
  },
  myQrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 10,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F4F8',
    paddingBottom: 18,
    marginBottom: 22,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0A1F44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'extrabold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'extrabold',
    color: '#0A1F44',
  },
  profileRole: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
  },
  profilePhone: {
    fontSize: 13,
    color: '#163D7A',
    fontWeight: '700',
    marginTop: 3,
  },
  qrImageContainer: {
    padding: 16,
    backgroundColor: '#F7F9FC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  personalQrImage: {
    width: 200,
    height: 200,
  },
  qrCaption: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 18,
  },
  qrActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  qrShareBtn: {
    flex: 1,
    backgroundColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  qrShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qrDownloadBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  qrDownloadBtnText: {
    color: '#0A1F44',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
