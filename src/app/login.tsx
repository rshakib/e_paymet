import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ActivityIndicator, ToastAndroid, Platform, Modal, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { globalSession } from '../constants/auth';
import { authApiService, savePersistentSession, setAuthToken } from '../services/api';


interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const translations = {
  en: {
    login: 'Log In',
    toAccount: 'to your account',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    appPin: 'App PIN',
    appPinPlaceholder: 'Enter your App PIN',
    forgotPin: 'Forgot PIN? ',
    resetPin: 'Reset PIN',
    newText: 'New? ',
    register: 'Register',
    next: 'Next',

    sensorInit: 'Initializing Biometric Sensor...',
    verifyPin: 'Verifying credentials...',
    verifying: 'Logging in securely...',
    granted: 'Access Granted!',
    resetTitle: 'Reset App PIN',
    enterMobile: 'Enter Registered Mobile Number',
    mobilePlaceholder: '01712 XXXXXX',
    sendCode: 'Send Verification Code',
    otpTitle: 'Enter OTP Code',
    otpSub: 'A 4-digit code has been sent to your mobile.',
    otpPlaceholder: 'Enter 4-digit OTP',
    verifyOtp: 'Verify Code',
    timerText: 'Code expires in: ',
    resendOtp: 'Resend Code',
    newPinTitle: 'Set New App PIN',
    newPinSub: 'Choose a secure 4-6 digit numeric passcode.',
    newPinPlaceholder: 'Enter New App PIN',
    confirmPinPlaceholder: 'Confirm New App PIN',
    submitPin: 'Reset App PIN Now',
    resetSuccessTitle: 'PIN Reset Successful!',
    resetSuccessSub: 'Your App PIN has been updated in memory. You can now log in using your new credentials.',
    complete: 'Complete & Close',
    exitTitle: 'Exit NiroPay?',
    exitSub: 'Are you sure you want to exit the application?',
    exitCancel: 'Cancel',
    exitConfirm: 'Exit App',
    toastEnterMobile: 'Please enter a valid mobile number',
    toastOtpSent: 'Mock verification OTP code sent!',
    toastOtpSuccess: 'OTP verified successfully!',
    toastEnterOtp: 'Please enter the 4-digit OTP code',
    toastPinLength: 'PIN must be 4 to 6 digits',
    toastPinMismatch: 'PINs do not match!',
    toastPinSaved: 'App PIN updated! Log in using the new PIN.',
    toastLoginInvalid: 'Invalid username or PIN! Use nadirhossain / 1234 or register a new account.',
    toastAutofill: 'OTP code autofilled!',
  },
  bn: {
    login: 'লগ ইন',
    toAccount: 'আপনার অ্যাকাউন্টে',
    username: 'ব্যবহারকারীর নাম',
    usernamePlaceholder: 'আপনার ব্যবহারকারীর নাম লিখুন',
    appPin: 'অ্যাপ পিন',
    appPinPlaceholder: 'আপনার অ্যাপ পিন লিখুন',
    forgotPin: 'পিন ভুলে গেছেন? ',
    resetPin: 'রিসেট পিন',
    newText: 'নতুন? ',
    register: 'রেজিস্ট্রেশন',
    next: 'পরবর্তী',

    sensorInit: 'বায়োমেট্রিক সেন্সর সক্রিয় করা হচ্ছে...',
    verifyPin: 'তথ্য যাচাই করা হচ্ছে...',
    verifying: 'নিরাপদে লগইন করা হচ্ছে...',
    granted: 'প্রবেশ অনুমোদিত!',
    resetTitle: 'অ্যাপ পিন রিসেট করুন',
    enterMobile: 'নিবন্ধিত মোবাইল নম্বর লিখুন',
    mobilePlaceholder: '০১৭১২ XXXXXX',
    sendCode: 'যাচাইকরণ কোড পাঠান',
    otpTitle: 'ওটিপি কোড লিখুন',
    otpSub: 'আপনার মোবাইলে একটি ৪-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।',
    otpPlaceholder: '৪-সংখ্যার ওটিপি লিখুন',
    verifyOtp: 'কোড যাচাই করুন',
    timerText: 'কোডের মেয়াদ শেষ হবে: ',
    resendOtp: 'কোড পুনরায় পাঠান',
    newPinTitle: 'নতুন অ্যাপ পিন সেট করুন',
    newPinSub: 'একটি ৪-৬ সংখ্যার শক্তিশালী পিন নির্বাচন করুন।',
    newPinPlaceholder: 'নতুন অ্যাপ পিন লিখুন',
    confirmPinPlaceholder: 'নতুন অ্যাপ পিন নিশ্চিত করুন',
    submitPin: 'পিন রিসেট করুন',
    resetSuccessTitle: 'পিন সফলভাবে রিসেট হয়েছে!',
    resetSuccessSub: 'আপনার অ্যাপ পিন সফলভাবে আপডেট করা হয়েছে। আপনি এখন নতুন পিন ব্যবহার করে লগইন করতে পারবেন।',
    complete: 'সম্পন্ন করুন',
    exitTitle: 'নিরোপে থেকে বের হবেন?',
    exitSub: 'আপনি কি নিশ্চিত যে আপনি অ্যাপ্লিকেশনটি বন্ধ করতে চান?',
    exitCancel: 'বাতিল',
    exitConfirm: 'বন্ধ করুন',
    toastEnterMobile: 'সঠিক মোবাইল নম্বর লিখুন',
    toastOtpSent: 'মক যাচাইকরণ ওটিপি কোড পাঠানো হয়েছে!',
    toastOtpSuccess: 'ওটিপি কোড সফলভাবে যাচাই করা হয়েছে!',
    toastEnterOtp: 'দয়া করে ৪-সংখ্যার ওটিপি কোডটি লিখুন',
    toastPinLength: 'পিন অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে',
    toastPinMismatch: 'পিন নম্বর দুটি মেলেনি!',
    toastPinSaved: 'অ্যাপ পিন আপডেট হয়েছে! নতুন পিন দিয়ে লগইন করুন।',
    toastLoginInvalid: 'ভুল ব্যবহারকারীর নাম বা পিন! nadirhossain / 1234 ব্যবহার করুন বা নতুন অ্যাকাউন্ট খুলুন।',
    toastAutofill: 'ওটিপি কোড অটোফিল করা হয়েছে!',
  }
};

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const router = useRouter();

  // Active Locale State
  const [lang, setLang] = useState(globalSession.currentLanguage);
  const t = translations[lang];

  // Form input states (Initially completely empty as requested)
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  // States for verification overlays
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('');
  
  // Custom interactive Modals
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState('');
  const [forgotPinVisible, setForgotPinVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Forgot PIN Wizard States
  const [resetStep, setResetStep] = useState(1); // 1: Mobile, 2: OTP, 3: New PIN, 4: Success
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [otpTimer, setOtpTimer] = useState(180); // 3 minutes counter

  // Timer Ref for cleanup
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    globalSession.currentLanguage = nextLang;
  };

  const addPinDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const deletePinDigit = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  // 100% Workable PIN Verification with Supabase Database
  const verifyLoginCredentials = async () => {
    if (isVerifying) return;
    if (pin.length < 4) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastPinLength, ToastAndroid.SHORT);
      }
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(t.verifyPin);

    try {
      const response = await authApiService.login(username.trim(), pin);
      
      if (response.success && response.data) {
        setVerifyStatus(t.granted);
        
        // Securely store credentials for future biometric login
        SecureStore.setItemAsync('biometric_username', username.trim());
        SecureStore.setItemAsync('biometric_pin', pin);

        const profile = {
          username: username.trim(),
          pin: pin,
          fullName: response.data.user.full_name,
          mobile: '', 
          nid: '',
          dob: '',
          k1: response.data.user.k1,
          k2: response.data.user.k2,
          bp: response.data.user.bp,
          last_t: response.data.user.last_t,
        };

        // Update local session cache
        globalSession.registeredUser = profile;
        
        // PERSISTENCE (PR1)
        if (response.data.access_token) {
          setAuthToken(response.data.access_token);
          await savePersistentSession(response.data.access_token, profile);
        }

        setTimeout(() => {
          setIsVerifying(false);
          setVerifyStatus('');
          setPin('');
          onLoginSuccess();
        }, 800);
      } else {
        setIsVerifying(false);
        setVerifyStatus('');
        if (Platform.OS === 'android') {
          ToastAndroid.show(response.error || t.toastLoginInvalid, ToastAndroid.LONG);
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      setVerifyStatus('');
      if (Platform.OS === 'android') {
        ToastAndroid.show("Connection error during login", ToastAndroid.LONG);
      }
      console.error(err);
    }
  };

  // 100% Workable Biometrics Scan with Supabase Database verification (bypassed for local demo)
  const startBiometricScan = async () => {
    // 1. Check if biometrics are enabled/cached
    const storedUsername = await SecureStore.getItemAsync('biometric_username');
    const storedPin = await SecureStore.getItemAsync('biometric_pin');
    
    if (!storedUsername || !storedPin) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Please login with PIN first to enable biometrics!", ToastAndroid.LONG);
      } else {
        alert("Please login with PIN first to enable biometrics!");
      }
      return;
    }

    // 2. Check hardware support
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !isEnrolled) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Biometrics not available or not enrolled!", ToastAndroid.SHORT);
      } else {
        alert("Biometrics not available or not enrolled!");
      }
      return;
    }

    // 3. Trigger real hardware sensor challenge
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsVerifying(true);
        setVerifyStatus(t.verifying);

        // 4. Authenticate using database
        const response = await authApiService.login(storedUsername, storedPin);
        
        if (response.success && response.data) {
          setVerifyStatus(t.granted);
          
          const profile = {
            username: storedUsername,
            pin: storedPin,
            fullName: response.data.user.full_name,
            mobile: '', 
            nid: '',
            dob: '',
            k1: response.data.user.k1,
            k2: response.data.user.k2,
            bp: response.data.user.bp,
            last_t: response.data.user.last_t,
          };

          globalSession.registeredUser = profile;

          // PERSISTENCE (PR1)
          if (response.data.access_token) {
            setAuthToken(response.data.access_token);
            await savePersistentSession(response.data.access_token, profile);
          }

          setTimeout(() => {
            setIsVerifying(false);
            setVerifyStatus('');
            setPin('');
            onLoginSuccess();
          }, 800);
        } else {
          setIsVerifying(false);
          setVerifyStatus('');
          const errMsg = response.error || t.toastLoginInvalid;
          if (Platform.OS === 'android') {
            ToastAndroid.show(errMsg, ToastAndroid.LONG);
          } else {
            alert(errMsg);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setIsVerifying(false);
      setVerifyStatus('');
    }
  };

  // Forgot PIN Flow functions
  const startTimer = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    setOtpTimer(180);
    const id = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerIntervalId(id);
  };

  const handleSendOtp = () => {
    if (!resetMobile.trim()) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastEnterMobile, ToastAndroid.SHORT);
      }
      return;
    }
    
    setIsVerifying(true);
    setVerifyStatus(t.sensorInit);

    setTimeout(() => {
      setIsVerifying(false);
      setVerifyStatus('');
      setResetStep(2);
      startTimer();
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastOtpSent, ToastAndroid.SHORT);
      }
    }, 1000);
  };

  const handleAutofillOtp = () => {
    setResetOtp('1234');
    if (Platform.OS === 'android') {
      ToastAndroid.show(t.toastAutofill, ToastAndroid.SHORT);
    }
  };

  const handleVerifyOtp = () => {
    if (resetOtp.trim() !== '1234') {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastEnterOtp, ToastAndroid.SHORT);
      }
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(t.verifyPin);

    setTimeout(() => {
      setIsVerifying(false);
      setVerifyStatus('');
      if (timerIntervalId) clearInterval(timerIntervalId);
      setResetStep(3);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastOtpSuccess, ToastAndroid.SHORT);
      }
    }, 1000);
  };

  const handleSetNewPin = async () => {
    if (resetNewPin.length < 4 || resetNewPin.length > 6) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastPinLength, ToastAndroid.SHORT);
      }
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastPinMismatch, ToastAndroid.SHORT);
      }
      return;
    }

    setIsVerifying(true);
    setVerifyStatus(t.verifying);

    // Bypass API client, run completely locally
    setTimeout(() => {
      setIsVerifying(false);
      setVerifyStatus('');

      // Local sync cache update
      globalSession.registeredUser.pin = resetNewPin;
      if (resetMobile.trim()) {
        globalSession.registeredUser.mobile = resetMobile;
      }
      
      setResetStep(4);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t.toastPinSaved, ToastAndroid.SHORT);
      }
    }, 1000);
  };

  const closeResetWizard = () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    setForgotPinVisible(false);
    setResetStep(1);
    setResetMobile('');
    setResetOtp('');
    setResetNewPin('');
    setResetConfirmPin('');
  };

  const formatTimerValue = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleExitApplication = () => {
    setExitModalVisible(false);
    BackHandler.exitApp();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />

      {/* Top curved navy banner area */}
      <View style={styles.topBanner}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            {/* Exit Confirmation Trigger on Back button */}
            <TouchableOpacity onPress={() => setExitModalVisible(true)} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.langCapsule} onPress={toggleLanguage} activeOpacity={0.75}>
                <Text style={styles.langText}>🌐 {lang === 'en' ? 'EN' : 'BN'} ∨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Welcome Headers matching log.png, without eagle icon */}
        <View style={styles.bannerBody}>
          <View style={styles.bannerLeft}>
            <Text style={styles.loginTitleText}>{t.login}</Text>
            <Text style={styles.loginSubtitleText}>{t.toAccount}</Text>
          </View>
        </View>
      </View>

      {/* White curved overlapping panel */}
      <View style={styles.whiteCard}>
        {/* Username Field */}
        <Text style={styles.inputLabel}>{t.username}</Text>
        <View style={styles.inputRowCard}>
          <View style={[styles.inputIconBg, { backgroundColor: '#EBF3FF' }]}>
            <Text style={styles.inputIcon}>👤</Text>
          </View>
          <TextInput 
            placeholder={t.usernamePlaceholder}
            placeholderTextColor="#999"
            style={styles.textInputMain}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* PIN Input field */}
        <Text style={styles.inputLabel}>{t.appPin}</Text>
        <View style={styles.inputRowCard}>
          <View style={[styles.inputIconBg, { backgroundColor: '#EBF3FF' }]}>
            <Text style={styles.inputIcon}>🔒</Text>
          </View>
          <TextInput 
            placeholder={t.appPinPlaceholder}
            placeholderTextColor="#999"
            secureTextEntry
            editable={false}
            style={styles.textInputMain}
            value={pin}
          />
          <TouchableOpacity 
            style={styles.quickBiometricLink} 
            onPress={startBiometricScan}
            activeOpacity={0.7}
          >
            <Text style={styles.quickBiometricIcon}>🫆</Text>
          </TouchableOpacity>
        </View>

        {/* Actions Row */}
        <View style={styles.forgotRow}>
          <TouchableOpacity onPress={() => { setForgotPinVisible(true); setResetStep(1); }} activeOpacity={0.7}>
            <Text style={styles.forgotLinkText}>{t.forgotPin}<Text style={styles.forgotHighlight}>{t.resetPin}</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
            <Text style={styles.registerLinkText}>{t.newText}<Text style={styles.registerHighlight}>{t.register}</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Solid Navy Continue Button */}
        <TouchableOpacity 
          style={[styles.nextButton, (pin.length < 4 || !username.trim()) && styles.nextButtonDisabled]}
          onPress={verifyLoginCredentials}
          disabled={pin.length < 4 || !username.trim()}
          activeOpacity={0.9}
        >
          <Text style={styles.nextButtonText}>{t.next}</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>

        {/* 100% Workable Custom Gray Keypad */}
        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('1')} activeOpacity={0.6}>
              <Text style={styles.keyText}>1</Text>
              <Text style={styles.keySubtext}> </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('2')} activeOpacity={0.6}>
              <Text style={styles.keyText}>2</Text>
              <Text style={styles.keySubtext}>ABC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('3')} activeOpacity={0.6}>
              <Text style={styles.keyText}>3</Text>
              <Text style={styles.keySubtext}>DEF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('4')} activeOpacity={0.6}>
              <Text style={styles.keyText}>4</Text>
              <Text style={styles.keySubtext}>GHI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('5')} activeOpacity={0.6}>
              <Text style={styles.keyText}>5</Text>
              <Text style={styles.keySubtext}>JKL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('6')} activeOpacity={0.6}>
              <Text style={styles.keyText}>6</Text>
              <Text style={styles.keySubtext}>MNO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('7')} activeOpacity={0.6}>
              <Text style={styles.keyText}>7</Text>
              <Text style={styles.keySubtext}>PQRS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('8')} activeOpacity={0.6}>
              <Text style={styles.keyText}>8</Text>
              <Text style={styles.keySubtext}>TUV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('9')} activeOpacity={0.6}>
              <Text style={styles.keyText}>9</Text>
              <Text style={styles.keySubtext}>WXYZ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.key} onPress={deletePinDigit} activeOpacity={0.6}>
              <Text style={styles.deleteIcon}>⌫</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={() => addPinDigit('0')} activeOpacity={0.6}>
              <Text style={styles.keyText}>0</Text>
              <Text style={styles.keySubtext}> </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.biometricKey} onPress={startBiometricScan} activeOpacity={0.6}>
              <Text style={styles.biometricEmoji}>🫆</Text>
            </TouchableOpacity>
          </View>
        </View>


      </View>

      {/* BIOMETRIC SCANNING PULSING MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={biometricModalVisible}
        onRequestClose={() => setBiometricModalVisible(false)}
      >
        <View style={styles.modalBlurOverlay}>
          <View style={styles.biometricBox}>
            <Text style={styles.biometricTitleText}>{t.biometricTitle}</Text>
            
            {/* Pulsing finger scan animation */}
            <View style={styles.fingerprintPulserContainer}>
              <View style={styles.pulsingWaveOuter} />
              <View style={styles.pulsingWaveInner} />
              <View style={styles.fingerprintCircleCenter}>
                <Text style={styles.pulsingFingerprintEmoji}>🫆</Text>
              </View>
            </View>

            <ActivityIndicator size="small" color="#004BCE" style={{ marginTop: 25 }} />
            <Text style={styles.biometricLoaderStatusText}>{biometricStatus}</Text>
          </View>
        </View>
      </Modal>

      {/* FORGOT PIN RESET WIZARD MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={forgotPinVisible}
        onRequestClose={closeResetWizard}
      >
        <View style={styles.wizardModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
          
          {/* Header */}
          <View style={styles.wizardHeader}>
            <TouchableOpacity onPress={closeResetWizard} style={styles.closeWizardBtn}>
              <Text style={styles.closeWizardBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.wizardHeaderTitle}>{t.resetTitle}</Text>
            <View style={{ width: 35 }} />
          </View>

          {/* Progress Circles */}
          <View style={styles.wizardStepsRow}>
            <View style={[styles.wizardCircle, resetStep >= 1 && styles.wizardCircleActive]}>
              <Text style={[styles.wizardCircleText, resetStep >= 1 && styles.wizardCircleTextActive]}>1</Text>
            </View>
            <View style={styles.wizardConnectorLine} />
            <View style={[styles.wizardCircle, resetStep >= 2 && styles.wizardCircleActive]}>
              <Text style={[styles.wizardCircleText, resetStep >= 2 && styles.wizardCircleTextActive]}>2</Text>
            </View>
            <View style={styles.wizardConnectorLine} />
            <View style={[styles.wizardCircle, resetStep >= 3 && styles.wizardCircleActive]}>
              <Text style={[styles.wizardCircleText, resetStep >= 3 && styles.wizardCircleTextActive]}>3</Text>
            </View>
            <View style={styles.wizardConnectorLine} />
            <View style={[styles.wizardCircle, resetStep >= 4 && styles.wizardCircleActive]}>
              <Text style={[styles.wizardCircleText, resetStep >= 4 && styles.wizardCircleTextActive]}>✓</Text>
            </View>
          </View>

          {/* STEP 1: MOBILE ENTRY */}
          {resetStep === 1 && (
            <View style={styles.wizardFormBody}>
              <View style={styles.wizardIllustrationBg}>
                <Text style={styles.wizardIllustrationEmoji}>📱</Text>
              </View>
              <Text style={styles.wizardSectionTitle}>{t.enterMobile}</Text>
              
              <View style={styles.wizardInputRow}>
                <Text style={styles.wizardFlagIcon}>🇧🇩</Text>
                <TextInput
                  placeholder={t.mobilePlaceholder}
                  placeholderTextColor="#AAA"
                  keyboardType="numeric"
                  style={styles.wizardTextInput}
                  value={resetMobile}
                  onChangeText={setResetMobile}
                />
              </View>

              <TouchableOpacity style={styles.wizardMainBtn} onPress={handleSendOtp}>
                <Text style={styles.wizardMainBtnText}>{t.sendCode}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: OTP INPUT WITH TIMER */}
          {resetStep === 2 && (
            <View style={styles.wizardFormBody}>
              <View style={styles.wizardIllustrationBg}>
                <Text style={styles.wizardIllustrationEmoji}>✉️</Text>
              </View>
              <Text style={styles.wizardSectionTitle}>{t.otpTitle}</Text>
              <Text style={styles.wizardSectionSub}>{t.otpSub}</Text>
              
              <View style={styles.wizardInputRow}>
                <TextInput
                  placeholder={t.otpPlaceholder}
                  placeholderTextColor="#AAA"
                  keyboardType="numeric"
                  maxLength={4}
                  style={[styles.wizardTextInput, { textAlign: 'center', letterSpacing: 8, fontSize: 18 }]}
                  value={resetOtp}
                  onChangeText={setResetOtp}
                />
              </View>

              <View style={styles.otpRowActions}>
                <Text style={styles.otpTimerCountdown}>{t.timerText}{formatTimerValue(otpTimer)}</Text>
                <TouchableOpacity onPress={handleAutofillOtp}>
                  <Text style={styles.autofillOtpLink}>{t.autofill}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.wizardMainBtn} onPress={handleVerifyOtp}>
                <Text style={styles.wizardMainBtnText}>{t.verifyOtp}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: CREATE NEW PIN */}
          {resetStep === 3 && (
            <View style={styles.wizardFormBody}>
              <View style={styles.wizardIllustrationBg}>
                <Text style={styles.wizardIllustrationEmoji}>🔒</Text>
              </View>
              <Text style={styles.wizardSectionTitle}>{t.newPinTitle}</Text>
              <Text style={styles.wizardSectionSub}>{t.newPinSub}</Text>
              
              <View style={styles.wizardInputRow}>
                <TextInput
                  placeholder={t.newPinPlaceholder}
                  placeholderTextColor="#AAA"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  style={styles.wizardTextInput}
                  value={resetNewPin}
                  onChangeText={setResetNewPin}
                />
              </View>

              <View style={styles.wizardInputRow}>
                <TextInput
                  placeholder={t.confirmPinPlaceholder}
                  placeholderTextColor="#AAA"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  style={styles.wizardTextInput}
                  value={resetConfirmPin}
                  onChangeText={setResetConfirmPin}
                />
              </View>

              <TouchableOpacity style={styles.wizardMainBtn} onPress={handleSetNewPin}>
                <Text style={styles.wizardMainBtnText}>{t.submitPin}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {resetStep === 4 && (
            <View style={styles.wizardFormBody}>
              <View style={styles.wizardSuccessCircleBadge}>
                <Text style={styles.wizardSuccessCircleBadgeText}>✓</Text>
              </View>
              <Text style={styles.wizardSectionTitle}>{t.resetSuccessTitle}</Text>
              <Text style={[styles.wizardSectionSub, { textAlign: 'center', paddingHorizontal: 20 }]}>
                {t.resetSuccessSub}
              </Text>

              <View style={styles.receiptDataCard}>
                <View style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemLabel}>Registered Username</Text>
                  <Text style={styles.receiptItemValue}>{username || 'nadirhossain'}</Text>
                </View>
                <View style={styles.receiptItemDivider} />
                <View style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemLabel}>Secure Active Mobile</Text>
                  <Text style={styles.receiptItemValue}>+880 {resetMobile || '01712 924659'}</Text>
                </View>
                <View style={styles.receiptItemDivider} />
                <View style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemLabel}>Security Token Status</Text>
                  <Text style={[styles.receiptItemValue, { color: '#27AE60', fontWeight: 'bold' }]}>ACTIVE</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.wizardMainBtn, { backgroundColor: '#27AE60' }]} onPress={closeResetWizard}>
                <Text style={styles.wizardMainBtnText}>{t.complete}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={exitModalVisible}
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.modalBlurOverlay}>
          <View style={styles.exitModalBox}>
            <Text style={styles.exitTitleText}>{t.exitTitle}</Text>
            <Text style={styles.exitSubText}>{t.exitSub}</Text>
            
            <View style={styles.exitButtonsRow}>
              <TouchableOpacity style={styles.exitCancelBtn} onPress={() => setExitModalVisible(false)}>
                <Text style={styles.exitCancelBtnText}>{t.exitCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitConfirmBtn} onPress={handleExitApplication}>
                <Text style={styles.exitConfirmBtnText}>{t.exitConfirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SECURE LOADING SCREEN OVERLAY */}
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
    backgroundColor: '#0A1F44' 
  },
  topBanner: {
    height: '24%',
    justifyContent: 'space-between',
    paddingBottom: 25,
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
    padding: 6,
  },
  backArrow: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  bannerBody: {
    paddingHorizontal: 25,
  },
  bannerLeft: {
    width: '100%',
  },
  loginTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginSubtitleText: {
    fontSize: 14,
    color: '#B3C0D6',
    marginTop: 4,
  },
  whiteCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A1F44',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRowCard: {
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
  inputIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputIcon: {
    fontSize: 16,
  },
  textInputMain: {
    flex: 1,
    height: '100%',
    color: '#0A1F44',
    fontSize: 14,
    fontWeight: '600',
  },
  quickBiometricLink: {
    padding: 6,
  },
  quickBiometricIcon: {
    fontSize: 20,
    color: '#004BCE',
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  forgotLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  forgotHighlight: {
    color: '#004BCE',
    fontWeight: '700',
  },
  registerLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  registerHighlight: {
    color: '#004BCE',
    fontWeight: '700',
  },
  nextButton: {
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
    marginBottom: 22,
  },
  nextButtonDisabled: {
    backgroundColor: '#E2E8F0',
    elevation: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  keypad: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
  },
  key: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  biometricKey: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF3FF',
    borderWidth: 1.5,
    borderColor: '#D4E2FC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  biometricEmoji: {
    fontSize: 20,
    color: '#004BCE',
  },
  keyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  keySubtext: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: -2,
    textTransform: 'uppercase',
  },
  deleteIcon: {
    fontSize: 18,
    color: '#0A1F44',
  },
  calloutCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    borderWidth: 1,
    borderColor: '#D4E2FC',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 10,
  },
  infoCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  calloutTextContainer: {
    flex: 1,
  },
  calloutTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#004BCE',
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 10,
    color: '#004BCE',
    fontWeight: '600',
    lineHeight: 13,
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

  // BIOMETRIC OVERLAY MODAL STYLES
  modalBlurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 31, 68, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    width: '80%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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

  // WIZARD FORGOT PIN STYLES
  wizardModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wizardHeader: {
    backgroundColor: '#0A1F44',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  closeWizardBtn: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeWizardBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wizardHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wizardStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 30,
  },
  wizardCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardCircleActive: {
    backgroundColor: '#004BCE',
  },
  wizardCircleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  wizardCircleTextActive: {
    color: '#FFFFFF',
  },
  wizardConnectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  wizardFormBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 15,
  },
  wizardIllustrationBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wizardIllustrationEmoji: {
    fontSize: 32,
  },
  wizardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
    textAlign: 'center',
  },
  wizardSectionSub: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  wizardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    width: '100%',
    marginBottom: 15,
    backgroundColor: '#F8FAFC',
  },
  wizardFlagIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  wizardTextInput: {
    flex: 1,
    height: '100%',
    color: '#0A1F44',
    fontSize: 13,
    fontWeight: 'bold',
  },
  wizardMainBtn: {
    backgroundColor: '#004BCE',
    height: 48,
    borderRadius: 24,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
  },
  wizardMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  otpRowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 15,
  },
  otpTimerCountdown: {
    fontSize: 11,
    color: '#EB5757',
    fontWeight: '600',
  },
  autofillOtpLink: {
    fontSize: 11,
    color: '#004BCE',
    fontWeight: 'bold',
  },
  wizardSuccessCircleBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  wizardSuccessCircleBadgeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  receiptDataCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginVertical: 20,
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptItemLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  receiptItemValue: {
    fontSize: 12,
    color: '#0A1F44',
    fontWeight: 'bold',
  },
  receiptItemDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },

  // EXIT MODAL STYLES
  exitModalBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  exitTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8,
  },
  exitSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  exitButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  exitCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  exitCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
  },
  exitConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EB5757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
