import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ActivityIndicator, ToastAndroid, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { CameraView, Camera } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';

const translations = {
  en: {
    register: 'Register',
    mobile: 'Mobile',
    identity: 'Identity',
    account: 'Account',
    security: 'Security',
    verify: 'Verify',
    toastNidLength: 'NID must be 10 or 13 digits',
    toastPinsMismatch: 'PINs do not match!',
    toastSecurityIncomplete: 'Please register fingerprint & face authentication first!',
    toastFillAll: 'Please fill out all fields!',
    toastCodeResent: 'Mock activation code resent successfully!',
    continueText: 'Continue',
    alreadyHaveAccount: 'Already have an account? ',
    loginText: 'Login',
    back: 'Back',

    // Step 1
    step1Title: 'Create Your Account',
    step1Sub: 'Register to enjoy secure and easy\nmobile payments.',
    mobileLabel: 'Mobile Number',
    codeLabel: 'Activation Code',
    codePlaceholder: 'Enter activation code (e.g. 1234)',
    resendCode: 'Resend Code',
    calloutStep1: 'A unique activation code was provided by your bank during account activation.',

    // Step 2
    step2Title: 'Identity Information',
    step2Sub: 'Enter your personal details',
    nidLabel: 'NID Number',
    nidPlaceholder: 'Enter 10 or 13 digit NID number',
    nidHelper: 'NID must be 10 or 13 digits',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    dobLabel: 'Date of Birth',
    dobPlaceholder: 'Select Date of Birth',
    calloutStep2: 'Full identity verification with NID is an upcoming feature.',

    // Step 3
    step3Title: 'Account Information',
    step3Sub: 'Set up your account credentials',
    userLabel: 'Username',
    userPlaceholder: 'Choose a unique username',
    userHelper: 'Username must be unique',
    createPinLabel: 'Create PIN (4-6 digits)',
    createPinPlaceholder: 'Enter secure App PIN',
    pinHelper: 'PIN must be 4 to 6 digits',
    confirmPinLabel: 'Confirm PIN',
    confirmPinPlaceholder: 'Re-enter secure App PIN',

    // Step 4
    step4Title: 'Security Setup',
    step4Sub: 'Set up biometric authentication',
    fingerprintLabel: 'Fingerprint',
    faceLabel: 'Face Authentication',
    fingerprintRegisterBtn: 'Register Fingerprint',
    fingerprintRegisterDesc: 'Tap to scan your fingerprint',
    faceRegisterBtn: 'Register Face',
    faceRegisterDesc: 'Tap to scan your face',
    calloutStep4: 'Biometric and face authentication are securely registered on your device.',

    // Step 5
    successTitle: 'Registration Successful!',
    successSub: 'Your account has been created successfully.',
    summaryUser: 'Username',
    summaryMobile: 'Mobile Number',
    summaryNid: 'NID Number',
    summaryDevice: 'Device (MAC Address)',

    goLogin: 'Go to Login',

    // DOB Picker
    selectDobTitle: 'Select Date of Birth',
    selectYear: 'Year',
    selectMonth: 'Month',
    selectDay: 'Day',
    confirmDob: 'Confirm Date',
    cancelDob: 'Cancel',

    // Biometrics Modal
    sensorInit: 'Initializing sensor scanner...',
    scanFingerprint: 'Scanning fingerprint...',
    scanFace: 'Opening Face ID Viewfinder...',
    faceGeometry: 'Analyzing facial geometry features...',
    biometricMatch: 'Matching biometric features...',
    granted: 'Registration complete!',
    biometricScanTitle: 'Biometric Enroller',
  },
  bn: {
    register: 'রেজিস্ট্রেশন',
    mobile: 'মোবাইল',
    identity: 'পরিচয়',
    account: 'অ্যাকাউন্ট',
    security: 'নিরাপত্তা',
    verify: 'যাচাই',
    toastNidLength: 'এনআইডি অবশ্যই ১০ বা ১৩ সংখ্যার হতে হবে',
    toastPinsMismatch: 'পিন নম্বর দুটি মেলেনি!',
    toastSecurityIncomplete: 'দয়া করে ফিঙ্গারপ্রিন্ট ও ফেস ভেরিফিকেশন রেজিস্টার করুন!',
    toastFillAll: 'দয়া করে সকল তথ্য পূরণ করুন!',
    toastCodeResent: 'মক অ্যাক্টিভেশন কোড সফলভাবে পাঠানো হয়েছে!',
    continueText: 'পরবর্তী',
    alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে? ',
    loginText: 'লগইন',
    back: 'পিছনে',

    // Step 1
    step1Title: 'আপনার অ্যাকাউন্ট তৈরি করুন',
    step1Sub: 'নিরাপদ এবং সহজ মোবাইল পেমেন্ট উপভোগ করতে\nরেজিস্ট্রেশন করুন।',
    mobileLabel: 'মোবাইল নম্বর',
    codeLabel: 'অ্যাক্টিভেশন কোড',
    codePlaceholder: 'অ্যাক্টিভেশন কোড লিখুন (যেমন: 1234)',
    resendCode: 'কোড পুনরায় পাঠান',
    calloutStep1: 'অ্যাকাউন্ট অ্যাক্টিভেশনের সময় আপনার ব্যাংক থেকে একটি অ্যাক্টিভেশন কোড প্রদান করা হয়েছিল।',

    // Step 2
    step2Title: 'পরিচয় তথ্য',
    step2Sub: 'আপনার ব্যক্তিগত তথ্য প্রদান করুন',
    nidLabel: 'এনআইডি নম্বর',
    nidPlaceholder: '১০ বা ১৩ সংখ্যার এনআইডি নম্বর লিখুন',
    nidHelper: 'এনআইডি অবশ্যই ১০ বা ১৩ সংখ্যার হতে হবে',
    nameLabel: 'পূর্ণ নাম',
    namePlaceholder: 'আপনার পূর্ণ নাম লিখুন',
    dobLabel: 'জন্ম তারিখ',
    dobPlaceholder: 'জন্ম তারিখ নির্বাচন করুন',
    calloutStep2: 'এনআইডি সহ সম্পূর্ণ পরিচয় যাচাইকরণ একটি আসন্ন ফিচার।',

    // Step 3
    step3Title: 'অ্যাকাউন্ট তথ্য',
    step3Sub: 'আপনার অ্যাকাউন্টের তথ্যাদি সেট আপ করুন',
    userLabel: 'ব্যবহারকারীর নাম',
    userPlaceholder: 'একটি অনন্য ব্যবহারকারীর নাম নির্বাচন করুন',
    userHelper: 'ব্যবহারকারীর নাম অনন্য হতে হবে',
    createPinLabel: 'পিন তৈরি করুন (৪-৬ সংখ্যা)',
    createPinPlaceholder: 'অ্যাপ পিন নম্বর দিন',
    pinHelper: 'পিন অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে',
    confirmPinLabel: 'পিন নিশ্চিত করুন',
    confirmPinPlaceholder: 'পিন নম্বর পুনরায় দিন',

    // Step 4
    step4Title: 'নিরাপত্তা সেটআপ',
    step4Sub: 'বায়োমেট্রিক প্রমাণীকরণ সেটআপ করুন',
    fingerprintLabel: 'ফিঙ্গারপ্রিন্ট',
    faceLabel: 'ফেস প্রমাণীকরণ',
    fingerprintRegisterBtn: 'ফিঙ্গারপ্রিন্ট রেজিস্টার করুন',
    fingerprintRegisterDesc: 'ফিঙ্গারপ্রিন্ট স্ক্যান করতে এখানে চাপুন',
    faceRegisterBtn: 'ফেস রেজিস্টার করুন',
    faceRegisterDesc: 'ফেস স্ক্যান করতে এখানে চাপুন',
    calloutStep4: 'বায়োমেট্রিক এবং ফেস প্রমাণীকরণ আপনার ডিভাইসে নিরাপদে নিবন্ধিত করা হয়েছে।',

    // Step 5
    successTitle: 'রেজিস্ট্রেশন সফল হয়েছে!',
    successSub: 'আপনার অ্যাকাউন্টটি সফলভাবে তৈরি করা হয়েছে।',
    summaryUser: 'ব্যবহারকারীর নাম',
    summaryMobile: 'মোবাইল নম্বর',
    summaryNid: 'এনআইডি নম্বর',
    summaryDevice: 'ডিভাইস (ম্যাক অ্যাড্রেস)',

    goLogin: 'লগইন-এ যান',

    // DOB Picker
    selectDobTitle: 'জন্ম তারিখ নির্বাচন করুন',
    selectYear: 'বছর',
    selectMonth: 'মাস',
    selectDay: 'দিন',
    confirmDob: 'নিশ্চিত করুন',
    cancelDob: 'বাতিল',

    // Biometrics Modal
    sensorInit: 'সেন্সর চালু করা হচ্ছে...',
    scanFingerprint: 'ফিঙ্গারপ্রিন্ট স্ক্যান করা হচ্ছে...',
    scanFace: 'ফেস ভিউফাইন্ডার চালু করা হচ্ছে...',
    faceGeometry: 'ফেসিয়াল জ্যামিতি পরিমাপ করা হচ্ছে...',
    biometricMatch: 'বায়োমেট্রিক তথ্য যাচাই করা হচ্ছে...',
    granted: 'নিবন্ধন সম্পন্ন হয়েছে!',
    biometricScanTitle: 'বায়োমেট্রিক এনরোলার',
  }
};

const monthsList = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function RegisterWizardScreen() {
  const router = useRouter();

  // Active Locale State
  const [lang, setLang] = useState(globalSession.currentLanguage);
  const t = translations[lang];

  // Wizard Step State
  const [step, setStep] = useState(1);

  // Input States (Initially completely empty as requested)
  const [mobileNumber, setMobileNumber] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Biometrics Enrollment States
  const [fingerprintRegistered, setFingerprintRegistered] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  // Loader states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');

  // Camera Face capture states
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);

  // Interactive Date of Birth Calendar Picker Modal States
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(1998);
  const [selectedMonth, setSelectedMonth] = useState('May');
  const [selectedDay, setSelectedDay] = useState(15);

  // Biometrics Enrollment Simulator Overlay States
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face'>('fingerprint');
  const [biometricStatus, setBiometricStatus] = useState('');

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    globalSession.currentLanguage = nextLang;
  };

  const triggerStepTransition = (nextStep: number, verifyLabel: string, delay: number = 1500) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setVerifyStatus(verifyLabel);
    
    setTimeout(() => {
      setIsVerifying(false);
      setStep(nextStep);
      setVerifyStatus('');
    }, delay);
  };

  const handleStep1Submit = () => {
    if (!mobileNumber.trim()) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastFillAll, ToastAndroid.SHORT);
      }
      return;
    }
    triggerStepTransition(2, t.sensorInit);
  };

  const handleStep2Submit = () => {
    if (nidNumber.length !== 10 && nidNumber.length !== 13) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastNidLength, ToastAndroid.SHORT);
      }
      return;
    }
    if (!fullName.trim() || !dob) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastFillAll, ToastAndroid.SHORT);
      }
      return;
    }
    triggerStepTransition(3, t.verifyPin);
  };

  const handleStep3Submit = () => {
    if (!username.trim() || pin.length < 4 || confirmPin !== pin) {
      if (confirmPin !== pin) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(t.toastPinsMismatch, ToastAndroid.SHORT);
        }
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show(t.toastFillAll, ToastAndroid.SHORT);
        }
      }
      return;
    }
    triggerStepTransition(4, t.verifying);
  };

  const handleStep4Submit = async () => {
    if (!fingerprintRegistered || !faceRegistered) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastSecurityIncomplete, ToastAndroid.SHORT);
      }
      return;
    }
    
    setIsVerifying(true);
    setVerifyStatus(t.verifying);

    try {
      const response = await authApiService.register({
        username: username.trim(),
        pin: pin,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        nidNumber: nidNumber.trim(),
        dateOfBirth: dob,
        hasFingerprint: fingerprintRegistered,
        hasFaceId: faceRegistered,
        activationCode: activationCode.trim()
      });

      setIsVerifying(false);
      setVerifyStatus('');

      if (response.success && response.data) {
        // Local sync cache update
        globalSession.registeredUser = {
          username: username.trim(),
          pin: pin,
          mobile: mobileNumber.trim(),
          nid: nidNumber.trim(),
          fullName: fullName.trim(),
          dob: dob,
        };
        
        triggerStepTransition(5, t.verifyPin);
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.error || "Registration failed!", ToastAndroid.LONG);
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      setVerifyStatus('');
      if (Platform.OS === 'android') {
        ToastAndroid.show("Connection error during registration", ToastAndroid.LONG);
      }
      console.error(err);
    }
  };


  const triggerBiometricScan = async (type: 'fingerprint' | 'face') => {
    // 1. Check if hardware supports biometrics
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (!hasHardware || supportedTypes.length === 0) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Biometric hardware not detected!", ToastAndroid.SHORT);
      }
      return;
    }

    // 2. Check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("No biometrics enrolled on this device!", ToastAndroid.SHORT);
      }
      return;
    }

    setBiometricType(type);
    setBiometricModalVisible(true);
    setBiometricStatus(t.sensorInit);

    // 3. Authenticate using real sensor
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: type === 'fingerprint' ? 'Register Fingerprint' : 'Register Face',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricStatus(t.granted);
        setTimeout(async () => {
          setBiometricModalVisible(false);
          setBiometricStatus('');
          if (type === 'fingerprint') {
            setFingerprintRegistered(true);
          } else {
            // Request camera permission and open front camera for Face Capture
            const { status } = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(status === 'granted');
            if (status === 'granted') {
              setCameraModalVisible(true);
            } else {
              if (Platform.OS === 'android') {
                ToastAndroid.show("Camera permission required for face verification!", ToastAndroid.LONG);
              } else {
                alert("Camera permission required for face verification!");
              }
            }
          }
        }, 1500);
      } else {
        setBiometricModalVisible(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show("Biometric enrollment failed!", ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      setBiometricModalVisible(false);
      console.error(error);
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
          // Generate simulated facial landmarker template hash
          const landmarksHash = CryptoJS.SHA256(`face-landmarks-${photo.uri}-${photo.width}-${photo.height}`).toString(CryptoJS.enc.Hex);
          
          // Securely store the face template in SecureStore
          await SecureStore.setItemAsync('face_landmarks_template', landmarksHash);
          
          setFaceRegistered(true);
          setCameraModalVisible(false);
          if (Platform.OS === 'android') {
            ToastAndroid.show("Face registered successfully!", ToastAndroid.SHORT);
          } else {
            alert("Face registered successfully!");
          }
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

  // Date of birth select
  const handleConfirmDob = () => {
    setDob(`${selectedDay} ${selectedMonth} ${selectedYear}`);
    setDobModalVisible(false);
  };

  const renderStepHeader = () => {
    const stepsDef = [
      { id: 1, label: t.mobile },
      { id: 2, label: t.identity },
      { id: 3, label: t.account },
      { id: 4, label: t.security },
      { id: 5, label: t.verify }
    ];

    return (
      <View style={styles.stepsContainerOuter}>
        {/* Absolute horizontal indicator connector line */}
        <View style={styles.stepsLine} />
        
        <View style={styles.stepsRow}>
          {stepsDef.map(s => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            
            return (
              <View key={s.id} style={styles.stepColumn}>
                <View style={[
                  styles.stepCircleCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted
                ]}>
                  <Text style={[
                    styles.stepCircleTextText,
                    isActive && styles.stepCircleTextActive,
                    isCompleted && styles.stepCircleTextCompleted
                  ]}>
                    {isCompleted ? '✓' : s.id}
                  </Text>
                </View>
                <Text style={[
                  styles.stepLabelText,
                  isActive && styles.stepLabelActive
                ]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />

      {/* Curved Royal Navy Header banner matching reg.png */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            {step > 1 && step < 5 ? (
              <TouchableOpacity onPress={() => setStep(prev => prev - 1)} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>{t.register}</Text>
            <TouchableOpacity style={styles.langCapsule} onPress={toggleLanguage} activeOpacity={0.75}>
              <Text style={styles.langText}>🌐 {lang === 'en' ? 'EN' : 'BN'} ∨</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        {/* Dynamic circular steps progress header */}
        {renderStepHeader()}
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* STEP 1: MOBILE REGISTRATION */}
        {step === 1 && (
          <View style={styles.stepFormContainer}>
            {/* Phone CSS high fidelity illustration */}
            <View style={styles.illustrationWrapper}>
              <View style={styles.illustrationBg}>
                <View style={styles.phoneFrame}>
                  <Text style={styles.userBadgeEmoji}>👤</Text>
                  <View style={styles.padlockBadgeCircle}>
                    <Text style={styles.padlockEmoji}>🔒</Text>
                  </View>
                  <View style={styles.shieldBadgeCircle}>
                    <Text style={styles.shieldEmoji}>✓</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.stageTitle}>{t.step1Title}</Text>
            <Text style={styles.stageSubtitle}>{t.step1Sub}</Text>

            {/* Mobile Input field */}
            <Text style={styles.inputFieldLabel}>{t.mobileLabel}</Text>
            <View style={styles.inputPillContainer}>
              <View style={styles.countryPicker}>
                <Text style={styles.flagEmoji}>🇧🇩</Text>
                <Text style={styles.countryCodeText}>+880</Text>
              </View>
              <View style={styles.inputSeparator} />
              <TextInput 
                placeholder="1712 345 678" 
                placeholderTextColor="#999"
                keyboardType="numeric"
                style={styles.textInputMain}
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Activation Code input field */}
            <Text style={styles.inputFieldLabel}>{t.codeLabel}</Text>
            <View style={styles.inputPillContainer}>
              <TextInput 
                placeholder={t.codePlaceholder} 
                placeholderTextColor="#999"
                style={[styles.textInputMain, { flex: 1 }]}
                value={activationCode}
                onChangeText={setActivationCode}
              />
            </View>

            {/* Blue Info Callout card */}
            <View style={styles.calloutCard}>
              <View style={styles.infoCircle}>
                <Text style={styles.infoText}>i</Text>
              </View>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutText}>{t.calloutStep1}</Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={[styles.continueBtn, !mobileNumber.trim() && styles.continueBtnDisabled]}
              onPress={handleStep1Submit}
              disabled={!mobileNumber.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>{t.continueText}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/')} activeOpacity={0.7} style={styles.loginLinkWrapper}>
              <Text style={styles.loginLinkText}>{t.alreadyHaveAccount}<Text style={styles.loginHighlight}>{t.loginText}</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: IDENTITY DETAILS */}
        {step === 2 && (
          <View style={styles.stepFormContainer}>
            <Text style={styles.stageTitleLeft}>{t.step2Title}</Text>
            <Text style={styles.stageSubtitleLeft}>{t.step2Sub}</Text>

            {/* NID Input card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.nidLabel}</Text>
              <View style={styles.cardInputRow}>
                <TextInput 
                  placeholder={t.nidPlaceholder}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  style={styles.cardTextInput}
                  value={nidNumber}
                  onChangeText={setNidNumber}
                />
                {(nidNumber.length === 10 || nidNumber.length === 13) && (
                  <View style={styles.checkedCircleBadge}>
                    <Text style={styles.checkBadgeIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.helperText}>{t.nidHelper}</Text>

            {/* Full Name input card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.nameLabel}</Text>
              <View style={styles.cardInputRow}>
                <TextInput 
                  placeholder={t.namePlaceholder}
                  placeholderTextColor="#999"
                  style={styles.cardTextInput}
                  value={fullName}
                  onChangeText={setFullName}
                />
                {fullName.trim().length > 1 && (
                  <View style={styles.checkedCircleBadge}>
                    <Text style={styles.checkBadgeIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 100% Workable Date of Birth card (Opens Calendar Modal) */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.dobLabel}</Text>
              <TouchableOpacity activeOpacity={0.7} style={styles.cardInputRow} onPress={() => setDobModalVisible(true)}>
                <Text style={styles.calendarIcon}>📅</Text>
                <Text style={[styles.dobTextValue, !dob && { color: '#999', fontWeight: 'normal' }]}>
                  {dob || t.dobPlaceholder}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Callout Info Box */}
            <View style={styles.calloutCard}>
              <View style={styles.infoCircle}>
                <Text style={styles.infoText}>i</Text>
              </View>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutText}>{t.calloutStep2}</Text>
              </View>
            </View>

            {/* Continue / Back triggers */}
            <TouchableOpacity 
              style={[styles.continueBtn, (!nidNumber || !fullName || !dob) && styles.continueBtnDisabled]}
              onPress={handleStep2Submit}
              disabled={!nidNumber || !fullName || !dob}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>{t.continueText}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7} style={styles.backLinkWrapper}>
              <Text style={styles.backLinkText}>← {t.back}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: ACCOUNT SETUP */}
        {step === 3 && (
          <View style={styles.stepFormContainer}>
            <Text style={styles.stageTitleLeft}>{t.step3Title}</Text>
            <Text style={styles.stageSubtitleLeft}>{t.step3Sub}</Text>

            {/* Username Input card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.userLabel}</Text>
              <View style={styles.cardInputRow}>
                <TextInput 
                  placeholder={t.userPlaceholder}
                  placeholderTextColor="#999"
                  style={styles.cardTextInput}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                {username.trim().length >= 3 && (
                  <View style={styles.checkedCircleBadge}>
                    <Text style={styles.checkBadgeIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.helperText}>{t.userHelper}</Text>

            {/* Create PIN Input card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.createPinLabel}</Text>
              <View style={styles.cardInputRow}>
                <TextInput 
                  placeholder={t.createPinPlaceholder}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  style={styles.cardTextInput}
                  value={pin}
                  onChangeText={setPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowPin(prev => !prev)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showPin ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.helperText}>{t.pinHelper}</Text>

            {/* Confirm PIN card */}
            <View style={styles.inputCard}>
              <Text style={styles.cardInputLabel}>{t.confirmPinLabel}</Text>
              <View style={styles.cardInputRow}>
                <TextInput 
                  placeholder={t.confirmPinPlaceholder}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  secureTextEntry={!showConfirmPin}
                  style={styles.cardTextInput}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowConfirmPin(prev => !prev)} activeOpacity={0.7}>
                  <Text style={styles.eyeIcon}>{showConfirmPin ? '👁️' : '🔒'}</Text>
                </TouchableOpacity>
                {confirmPin === pin && pin.length >= 4 && (
                  <View style={[styles.checkedCircleBadge, { marginLeft: 10 }]}>
                    <Text style={styles.checkBadgeIcon}>✓</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Step navigation buttons */}
            <TouchableOpacity 
              style={[styles.continueBtn, (confirmPin !== pin || pin.length < 4 || !username.trim()) && styles.continueBtnDisabled]}
              onPress={handleStep3Submit}
              disabled={confirmPin !== pin || pin.length < 4 || !username.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>{t.continueText}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.7} style={styles.backLinkWrapper}>
              <Text style={styles.backLinkText}>← {t.back}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4: SECURITY SETUPS */}
        {step === 4 && (
          <View style={styles.stepFormContainer}>
            <Text style={styles.stageTitleLeft}>{t.step4Title}</Text>
            <Text style={styles.stageSubtitleLeft}>{t.step4Sub}</Text>

            {/* Fingerprint setup card */}
            <Text style={styles.inputFieldLabel}>{t.fingerprintLabel}</Text>
            <TouchableOpacity 
              style={styles.biometricSelectCard}
              onPress={() => triggerBiometricScan('fingerprint')}
              activeOpacity={0.8}
            >
              <View style={[styles.biometricIconBg, { backgroundColor: '#EBF3FF' }]}>
                <Text style={styles.biometricEmojiIcon}>🫆</Text>
              </View>
              <View style={styles.biometricDetails}>
                <Text style={styles.biometricLabelText}>{t.fingerprintRegisterBtn}</Text>
                <Text style={styles.biometricDescText}>{t.fingerprintRegisterDesc}</Text>
              </View>
              {fingerprintRegistered && (
                <View style={styles.checkedCircleBadge}>
                  <Text style={styles.checkBadgeIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Face verification setup card */}
            <Text style={styles.inputFieldLabel}>{t.faceLabel}</Text>
            <TouchableOpacity 
              style={styles.biometricSelectCard}
              onPress={() => triggerBiometricScan('face')}
              activeOpacity={0.8}
            >
              <View style={[styles.biometricIconBg, { backgroundColor: '#EBF3FF' }]}>
                <Text style={styles.biometricEmojiIcon}>👤</Text>
              </View>
              <View style={styles.biometricDetails}>
                <Text style={styles.biometricLabelText}>{t.faceRegisterBtn}</Text>
                <Text style={styles.biometricDescText}>{t.faceRegisterDesc}</Text>
              </View>
              {faceRegistered && (
                <View style={styles.checkedCircleBadge}>
                  <Text style={styles.checkBadgeIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>



            {/* Continue options */}
            <TouchableOpacity 
              style={[styles.continueBtn, (!fingerprintRegistered || !faceRegistered) && styles.continueBtnDisabled]}
              onPress={handleStep4Submit}
              disabled={!fingerprintRegistered || !faceRegistered}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>{t.continueText}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(3)} activeOpacity={0.7} style={styles.backLinkWrapper}>
              <Text style={styles.backLinkText}>← {t.back}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 5: REGISTRATION SUCCESS */}
        {step === 5 && (
          <View style={styles.stepFormContainer}>
            {/* Absolute colorful floating confetti diamond/rectangle particles */}
            <View style={[styles.confetti, { top: 15, left: 20, backgroundColor: '#27AE60', transform: [{ rotate: '15deg' }] }]} />
            <View style={[styles.confetti, { top: 35, right: 30, backgroundColor: '#FF9F1A', transform: [{ rotate: '-25deg' }] }]} />
            <View style={[styles.confetti, { top: 75, left: 60, backgroundColor: '#EB5757', transform: [{ rotate: '45deg' }] }]} />
            
            <View style={styles.centerAlign}>
              <View style={styles.successCircleBadgeLarge}>
                <Text style={styles.successTickIcon}>✓</Text>
              </View>
              <Text style={styles.stageTitle}>{t.successTitle}</Text>
              <Text style={styles.stageSubtitle}>{t.successSub}</Text>
            </View>

            {/* Summary Receipt breakdown card showing users actual input! */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptIcon}>👤</Text>
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptLabel}>{t.summaryUser}</Text>
                  <Text style={styles.receiptVal}>{username}</Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptIcon}>📱</Text>
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptLabel}>{t.summaryMobile}</Text>
                  <Text style={styles.receiptVal}>+880 {mobileNumber}</Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptIcon}>💳</Text>
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptLabel}>{t.summaryNid}</Text>
                  <Text style={styles.receiptVal}>{nidNumber}</Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptIcon}>🔐</Text>
                <View style={styles.receiptDetails}>
                  <Text style={styles.receiptLabel}>{t.summaryDevice}</Text>
                  <Text style={styles.receiptVal}>A4:5E:60:12:34:AB</Text>
                </View>
              </View>
            </View>



            {/* Complete Login Redirect */}
            <TouchableOpacity 
              style={styles.goLoginButton}
              onPress={() => router.replace('/')}
              activeOpacity={0.85}
            >
              <Text style={styles.goLoginButtonText}>{t.goLogin}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* DATE OF BIRTH INTERACTIVE CALENDAR MODAL PICKER */}
      <Modal
        animationType="slide"
        transparent
        visible={dobModalVisible}
        onRequestClose={() => setDobModalVisible(false)}
      >
        <View style={styles.modalBlurOverlay}>
          <View style={styles.calendarModalBox}>
            <Text style={styles.calendarTitleText}>{t.selectDobTitle}</Text>

            {/* Grid Selectors for Day, Month, Year */}
            <View style={styles.pickerSelectorGrid}>
              
              {/* Day selection */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColHeader}>{t.selectDay}</Text>
                <ScrollView style={styles.pickerColScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                    const isSelected = selectedDay === dayNum;
                    return (
                      <TouchableOpacity 
                        key={dayNum} 
                        style={[styles.pickerItemCell, isSelected && styles.pickerItemCellActive]} 
                        onPress={() => setSelectedDay(dayNum)}
                      >
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Month selection */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColHeader}>{t.selectMonth}</Text>
                <ScrollView style={styles.pickerColScroll} showsVerticalScrollIndicator={false}>
                  {monthsList.map(monthName => {
                    const isSelected = selectedMonth === monthName;
                    return (
                      <TouchableOpacity 
                        key={monthName} 
                        style={[styles.pickerItemCell, isSelected && styles.pickerItemCellActive]} 
                        onPress={() => setSelectedMonth(monthName)}
                      >
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                          {monthName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Year selection */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerColHeader}>{t.selectYear}</Text>
                <ScrollView style={styles.pickerColScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 87 }, (_, i) => 2026 - i).map(yearNum => {
                    const isSelected = selectedYear === yearNum;
                    return (
                      <TouchableOpacity 
                        key={yearNum} 
                        style={[styles.pickerItemCell, isSelected && styles.pickerItemCellActive]} 
                        onPress={() => setSelectedYear(yearNum)}
                      >
                        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                          {yearNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

            </View>

            {/* Action buttons */}
            <View style={styles.calendarButtonsRow}>
              <TouchableOpacity style={styles.calendarCancelBtn} onPress={() => setDobModalVisible(false)}>
                <Text style={styles.calendarCancelBtnText}>{t.cancelDob}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarConfirmBtn} onPress={handleConfirmDob}>
                <Text style={styles.calendarConfirmBtnText}>{t.confirmDob}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* BIOMETRICS ENROLLMENT PULSING MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={biometricModalVisible}
        onRequestClose={() => setBiometricModalVisible(false)}
      >
        <View style={styles.modalBlurOverlay}>
          <View style={styles.biometricBox}>
            <Text style={styles.biometricTitleText}>{t.biometricScanTitle}</Text>
            
            {/* Pulsing visual indicator waves */}
            <View style={styles.fingerprintPulserContainer}>
              <View style={styles.pulsingWaveOuter} />
              <View style={styles.pulsingWaveInner} />
              <View style={styles.fingerprintCircleCenter}>
                <Text style={styles.pulsingFingerprintEmoji}>
                  {biometricType === 'fingerprint' ? '🫆' : '👤'}
                </Text>
              </View>
            </View>

            <ActivityIndicator size="small" color="#004BCE" style={{ marginTop: 25 }} />
            <Text style={styles.biometricLoaderStatusText}>{biometricStatus}</Text>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.cameraHeaderTitle}>Register Face</Text>
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

      {/* Secure loadings overlay */}
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
    backgroundColor: '#F7F9FC' 
  },
  header: { 
    backgroundColor: '#0A1F44', 
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 22,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
  },
  headerSafeArea: {
    width: '100%'
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 10,
  },
  backButton: {
    padding: 4,
  },
  backArrow: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginLeft: 30,
  },
  langCapsule: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepsContainerOuter: {
    width: '100%',
    paddingHorizontal: 25,
    marginTop: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  stepsLine: {
    position: 'absolute',
    left: 45,
    right: 45,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    top: 14,
    zIndex: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepColumn: {
    alignItems: 'center',
    width: 52,
  },
  stepCircleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepCircleActive: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  stepCircleCompleted: {
    backgroundColor: '#00C853',
  },
  stepCircleTextText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepCircleTextActive: {
    color: '#0A1F44',
  },
  stepCircleTextCompleted: {
    color: '#FFFFFF',
  },
  stepLabelText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  stepFormContainer: {
    width: '100%',
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: 70,
    height: 110,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#0A1F44',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBadgeEmoji: {
    fontSize: 26,
  },
  padlockBadgeCircle: {
    position: 'absolute',
    top: 15,
    left: -12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  padlockEmoji: {
    fontSize: 10,
  },
  shieldBadgeCircle: {
    position: 'absolute',
    bottom: 25,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  shieldEmoji: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1F44',
    textAlign: 'center',
    marginBottom: 8,
  },
  stageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  stageTitleLeft: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
  },
  stageSubtitleLeft: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A1F44',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  inputSeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  textInputMain: {
    flex: 1,
    height: '100%',
    color: '#0A1F44',
    fontSize: 14,
    fontWeight: '600',
  },
  calloutCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    borderWidth: 1,
    borderColor: '#D4E2FC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  calloutContent: {
    flex: 1,
  },
  calloutText: {
    fontSize: 11,
    color: '#004BCE',
    lineHeight: 16,
    fontWeight: '600',
  },
  calloutTextWarning: {
    fontSize: 11,
    color: '#D32F2F',
    lineHeight: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  continueBtn: {
    backgroundColor: '#0A1F44',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  continueBtnDisabled: {
    backgroundColor: '#E2E8F0',
    elevation: 0,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLinkWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  loginHighlight: {
    color: '#004BCE',
    fontWeight: '700',
  },
  backLinkWrapper: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  backLinkText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0A1F44',
    padding: 0,
  },
  checkedCircleBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 10,
    color: '#94A3B8',
    paddingLeft: 8,
    marginBottom: 16,
  },
  calendarIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  dobTextValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0A1F44',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#64748B',
  },
  eyeIcon: {
    fontSize: 14,
    color: '#64748B',
  },
  biometricSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  biometricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  biometricEmojiIcon: {
    fontSize: 20,
  },
  biometricDetails: {
    flex: 1,
  },
  biometricLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1F44',
  },
  biometricDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 1,
    opacity: 0.8,
  },
  centerAlign: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  successCircleBadgeLarge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E8F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successTickIcon: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 22,
    padding: 18,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  receiptIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  receiptDetails: {
    flex: 1,
  },
  receiptLabel: {
    fontSize: 11,
    color: '#777',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginTop: 2,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  testPhaseContainerCard: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#004BCE',
    backgroundColor: '#F0F5FF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
  },
  testShieldIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  testShieldIcon: {
    fontSize: 18,
  },
  testPhaseTextContent: {
    flex: 1,
  },
  testPhaseTitle: {
    fontSize: 12,
    fontWeight: 'extrabold',
    color: '#004BCE',
    marginBottom: 8,
  },
  testPhaseBullet: {
    fontSize: 10,
    color: '#333',
    lineHeight: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  goLoginButton: {
    backgroundColor: '#0A1F44',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 10,
  },
  goLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 31, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: '65%',
    elevation: 10,
  },
  loaderText: {
    fontSize: 14,
    color: '#0A1F44',
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },

  // MODAL BLUR AND DATE PICKER STYLES
  modalBlurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 31, 68, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    elevation: 10,
  },
  calendarTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 15,
  },
  pickerSelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 180,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  pickerColHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    textAlign: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  pickerColScroll: {
    flex: 1,
  },
  pickerItemCell: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemCellActive: {
    backgroundColor: '#004BCE',
  },
  pickerItemText: {
    fontSize: 13,
    color: '#0A1F44',
    fontWeight: 'bold',
  },
  pickerItemTextActive: {
    color: '#FFFFFF',
  },
  calendarButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  calendarCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  calendarCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
  calendarConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // BIOMETRIC SENSOR STYLES
  biometricBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    width: '80%',
    elevation: 15,
  },
  biometricTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 25,
  },
  fingerprintPulserContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulsingWaveOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(0, 75, 206, 0.15)',
    backgroundColor: 'rgba(0, 75, 206, 0.05)',
  },
  pulsingWaveInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 75, 206, 0.3)',
    backgroundColor: 'rgba(0, 75, 206, 0.08)',
  },
  fingerprintCircleCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  pulsingFingerprintEmoji: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  biometricLoaderStatusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginTop: 15,
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
    ...StyleSheet.absoluteFillObject, 
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
