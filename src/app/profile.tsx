import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { globalSession } from '../constants/auth';
import { authApiService, clearPersistentSession } from '../services/api';

export default function ProfileScreen() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const username = globalSession.registeredUser.username;
        if (!username) return;
        const res = await authApiService.getUserProfile(username);
        if (res.success && res.data) {
          setUserProfile(res.data.user);
        } else if (res.error && (res.error.includes('401') || res.error.includes('Unauthorized'))) {
          globalSession.isLoggedIn = false;
          router.replace('/');
          return;
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Interactive States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'BD'>('EN');
  
  // Loader States
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionLabel, setActionLabel] = useState('');

  const triggerMockAction = (label: string, onComplete: () => void) => {
    if (isActionPending) return;
    setIsActionPending(true);
    setActionLabel(label);
    setTimeout(() => {
      setIsActionPending(false);
      setActionLabel('');
      onComplete();
    }, 1200);
  };

  const toggleLanguage = () => {
    triggerMockAction(language === 'EN' ? 'Switching to Bangla...' : 'Switching to English...', () => {
      setLanguage(prev => prev === 'EN' ? 'BD' : 'EN');
    });
  };

  const toggleThemeState = () => {
    triggerMockAction('Applying Theme...', () => {
      setIsDarkMode(prev => !prev);
    });
  };



  // Translations Map
  const t = {
    EN: {
      profile: 'Profile',
      verified: 'Verified',
      gmailVerified: 'Gmail Verified',
      accountOverview: 'Account Overview',
      username: 'Username',
      mobileNumber: 'Mobile Number',
      email: 'Email (Gmail)',
      device: 'Device (MAC Address)',
      thisDevice: 'This Device',
      identityInfo: 'Identity Information',
      nidNumber: 'NID Number',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
      upcomingBadge: 'Upcoming',
      nidCallout: 'Full identity verification with NID is an upcoming feature.',
      securitySettings: 'Security Settings',
      changePin: 'Change PIN',
      changePinDesc: 'Update your 4-6 digit PIN',
      fingerprint: 'Fingerprint',
      fingerprintDesc: 'Manage your fingerprint',
      faceAuth: 'Face Authentication',
      faceAuthDesc: 'Manage your face authentication',
      accSecurity: 'Account Security',
      accSecurityDesc: 'Manage login & security settings',
      preferences: 'Preferences',
      lang: 'Language',
      theme: 'Theme',
      displayName: 'Display Name',
      prefDisclaimer: 'Display name is only for your UI view and will not change your server data.',
      limitsSettings: 'Limits & Settings',
      txLimit: 'Transaction Limit',
      txLimitDesc: 'View and manage your limits',
      quickAccess: 'Quick Access',
      quickAccessDesc: 'Manage quick access options',
      notifSettings: 'Notification Settings',
      notifSettingsDesc: 'Manage your notification preferences',
      supportHelp: 'Support & Help',
      helpCenter: 'Help Center',
      helpCenterDesc: 'Get help and support',
      faqs: 'FAQs',
      faqsDesc: 'Frequently asked questions',
      contactSupport: 'Contact Support',
      contactSupportDesc: 'Talk to our support team',
      appInfo: 'App Information',
      appInfoDesc: 'Version 1.0.0',
      logout: 'Logout',
      logoutDesc: 'Log out from your account',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    BD: {
      profile: 'প্রোফাইল',
      verified: 'যাচাইকৃত',
      gmailVerified: 'জিমেইল যাচাইকৃত',
      accountOverview: 'অ্যাকাউন্ট ওভারভিউ',
      username: 'ইউজারনেম',
      mobileNumber: 'মোবাইল নম্বর',
      email: 'ইমেইল (জিমেইল)',
      device: 'ডিভাইস (ম্যাক অ্যাড্রেস)',
      thisDevice: 'বর্তমান ডিভাইস',
      identityInfo: 'পরিচয় তথ্য',
      nidNumber: 'এনআইডি নম্বর',
      dateOfBirth: 'জন্ম তারিখ',
      address: 'ঠিকানা',
      upcomingBadge: 'আসন্ন',
      nidCallout: 'এনআইডি দিয়ে পরিচয় যাচাইকরণ ফিচারটি শীঘ্রই আসছে।',
      securitySettings: 'নিরাপত্তা সেটিংস',
      changePin: 'পিন পরিবর্তন',
      changePinDesc: 'আপনার ৪-৬ সংখ্যার পিন আপডেট করুন',
      fingerprint: 'ফিঙ্গারপ্রিন্ট',
      fingerprintDesc: 'ফিঙ্গারপ্রিন্ট ম্যানেজ করুন',
      faceAuth: 'ফেস অথেনটিকেশন',
      faceAuthDesc: 'ফেস অথেনটিকেশন ম্যানেজ করুন',
      accSecurity: 'অ্যাকাউন্ট সিকিউরিটি',
      accSecurityDesc: 'লগইন ও সিকিউরিটি সেটিংস',
      preferences: 'পছন্দসমূহ',
      lang: 'ভাষা',
      theme: 'থিম',
      displayName: 'প্রদর্শিত নাম',
      prefDisclaimer: 'প্রদর্শিত নামটি শুধুমাত্র আপনার অ্যাপ ইন্টারফেসের জন্য, কোনো পরিবর্তন সার্ভারে যাবে না।',
      limitsSettings: 'সীমা ও সেটিংস',
      txLimit: 'লেনদেন সীমা',
      txLimitDesc: 'আপনার লেনদেনের সীমা দেখুন',
      quickAccess: 'দ্রুত অ্যাক্সেস',
      quickAccessDesc: 'দ্রুত অ্যাক্সেসের অপশনগুলো দেখুন',
      notifSettings: 'বিজ্ঞপ্তি সেটিংস',
      notifSettingsDesc: 'বিজ্ঞপ্তির সেটিংসগুলো পরিচালনা করুন',
      supportHelp: 'সহায়তা ও সাহায্য',
      helpCenter: 'হেল্প সেন্টার',
      helpCenterDesc: 'সাহায্য ও সহযোগিতা পান',
      faqs: 'প্রশ্নোত্তরের তালিকা',
      faqsDesc: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী',
      contactSupport: 'সাপোর্ট কন্টাক্ট',
      contactSupportDesc: 'আমাদের টিমের সাথে কথা বলুন',
      appInfo: 'অ্যাপ্লিকেশন তথ্য',
      appInfoDesc: 'সংস্করণ ১.০.০',
      logout: 'লগআউট',
      logoutDesc: 'আপনার অ্যাকাউন্ট থেকে লগআউট করুন',
      enabled: 'সক্রিয়',
      disabled: 'নিষ্ক্রিয়',
    }
  };

  const curr = language === 'EN' ? t.EN : t.BD;

  const dynamicText = isDarkMode ? '#F1F5F9' : '#0A1F44';
  const cardBorder = isDarkMode ? '#1E293B' : '#EFEFEF';
  const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
  const textSub = isDarkMode ? '#94A3B8' : '#777777';

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F7F9FC' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />

      {/* Header matching profile.png */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#0F172A' : '#F7F9FC' }]}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
              <Text style={[styles.backArrow, { color: dynamicText }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: dynamicText }]}>{curr.profile}</Text>
            
            {/* Theme switcher moon & language capsule */}
            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.themeToggle} onPress={toggleThemeState} activeOpacity={0.75}>
                <Text style={[styles.themeIcon, { color: dynamicText }]}>{isDarkMode ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.langCapsule, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(10, 31, 68, 0.08)' }]} 
                onPress={toggleLanguage} 
                activeOpacity={0.75}
              >
                <Text style={[styles.langText, { color: dynamicText }]}>🌐 {language} ∨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Profile Card (Nadir Hossain) */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarSilhouette}>👤</Text>
            </View>
            <TouchableOpacity 
              style={styles.cameraBadge} 
              activeOpacity={0.8}
              onPress={() => triggerMockAction('Opening Camera Roll...', () => {})}
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: dynamicText }]}>{loading ? '...' : (userProfile?.full_name || 'User')}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ {curr.verified}</Text>
              </View>
            </View>
            <Text style={[styles.profileEmail, { color: textSub }]}>{loading ? '...' : (userProfile?.username ? `${userProfile.username}@ebanking.internal` : '')}</Text>
            
            <View style={styles.gmailVerifyRow}>
              <Text style={styles.gmailVerifyCheck}>✓</Text>
              <Text style={styles.gmailVerifyText}>{curr.gmailVerified}</Text>
            </View>
          </View>
          
          <Text style={styles.chevronRight}>&gt;</Text>
        </View>

        {/* Section 1: Account Overview */}
        <Text style={styles.sectionHeader}>{curr.accountOverview}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* Username */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>👤</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.username}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>{loading ? '...' : (userProfile?.username || '')}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Mobile Number */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#E8F8F0' }]}>
              <Text style={[styles.rowIcon, { color: '#27AE60' }]}>📞</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.mobileNumber}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>{loading ? '...' : (userProfile?.mobile_number || 'N/A')}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Email */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#F4EBFC' }]}>
              <Text style={[styles.rowIcon, { color: '#9B51E0' }]}>✉️</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.email}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>{loading ? '...' : (userProfile?.username ? `${userProfile.username}@ebanking.internal` : '')}</Text>
            </View>
            <View style={styles.rowBadgeGreen}>
              <Text style={styles.rowBadgeGreenText}>{curr.verified}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Device */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#FFF4E5' }]}>
              <Text style={[styles.rowIcon, { color: '#F2994A' }]}>💻</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.device}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>A4:••:••:••:AB</Text>
            </View>
            <View style={styles.rowBadgeBlue}>
              <Text style={styles.rowBadgeBlueText}>{curr.thisDevice}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

        </View>

        {/* Section 2: Identity Information */}
        <Text style={styles.sectionHeader}>{curr.identityInfo}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* NID */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>💳</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.nidNumber}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>XX XX XXXX XX XX</Text>
            </View>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{curr.upcomingBadge}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Date of Birth */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#F4EBFC' }]}>
              <Text style={[styles.rowIcon, { color: '#9B51E0' }]}>📅</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.dateOfBirth}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>XX XX XXXX</Text>
            </View>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{curr.upcomingBadge}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Address */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#E8F8F0' }]}>
              <Text style={[styles.rowIcon, { color: '#27AE60' }]}>📍</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={styles.rowLabel}>{curr.address}</Text>
              <Text style={[styles.rowVal, { color: dynamicText }]}>XX XX XX, XX XX XX</Text>
            </View>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{curr.upcomingBadge}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          {/* Callout Information Banner */}
          <View style={styles.nidCalloutBox}>
            <View style={styles.infoBadgeCircle}>
              <Text style={styles.infoBadgeText}>i</Text>
            </View>
            <Text style={styles.nidCalloutText}>{curr.nidCallout}</Text>
          </View>

        </View>

        {/* Section 3: Security Settings */}
        <Text style={styles.sectionHeader}>{curr.securitySettings}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* Change PIN */}
          <TouchableOpacity 
            style={styles.rowItem} 
            activeOpacity={0.7}
            onPress={() => triggerMockAction('Opening PIN settings...', () => {})}
          >
            <View style={[styles.rowIconBg, { backgroundColor: '#FFEDF1' }]}>
              <Text style={[styles.rowIcon, { color: '#EB5757' }]}>🔒</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.changePin}</Text>
              <Text style={styles.rowLabel}>{curr.changePinDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Fingerprint Status */}
          <View style={styles.rowItem}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>🫆</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.fingerprint}</Text>
              <Text style={styles.rowLabel}>{curr.fingerprintDesc}</Text>
            </View>
            <View style={[styles.stateBadge, styles.stateBadgeActive]}>
              <Text style={[styles.stateBadgeText, styles.stateBadgeTextActive]}>{curr.enabled}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Face Auth Status */}
          <View style={styles.rowItem}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>👤</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.faceAuth}</Text>
              <Text style={styles.rowLabel}>{curr.faceAuthDesc}</Text>
            </View>
            <View style={[styles.stateBadge, styles.stateBadgeActive]}>
              <Text style={[styles.stateBadgeText, styles.stateBadgeTextActive]}>{curr.enabled}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Device & Encryption Status */}
          <View style={styles.rowItem}>
            <View style={[styles.rowIconBg, { backgroundColor: '#E7F9F0' }]}>
              <Text style={[styles.rowIcon, { color: '#00C853' }]}>🛡️</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>Hardware binding & Security</Text>
              <Text style={styles.rowLabel}>AES-256 + HMAC encryption active</Text>
            </View>
            <View style={styles.rowBadgeGreen}>
              <Text style={styles.rowBadgeGreenText}>Secure</Text>
            </View>
          </View>

        </View>

        {/* Section 4: Preferences */}
        <Text style={styles.sectionHeader}>{curr.preferences}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* Language Preference */}
          <TouchableOpacity style={styles.rowItem} onPress={toggleLanguage} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>🌐</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.lang}</Text>
            </View>
            <Text style={styles.prefValText}>{language === 'EN' ? 'English' : 'Bangla'}</Text>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Theme Preference */}
          <TouchableOpacity style={styles.rowItem} onPress={toggleThemeState} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>🌙</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.theme}</Text>
            </View>
            <Text style={styles.prefValText}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Display Name */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>👤</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.displayName}</Text>
            </View>
            <Text style={styles.prefValText}>{loading ? '...' : (userProfile?.full_name || 'User')}</Text>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

        </View>
        <Text style={styles.prefDisclaimer}>{curr.prefDisclaimer}</Text>

        {/* Section 5: Limits & Settings */}
        <Text style={styles.sectionHeader}>{curr.limitsSettings}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* Transaction Limit */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>📊</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.txLimit}</Text>
              <Text style={styles.rowLabel}>{curr.txLimitDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Quick Access */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>⚡</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.quickAccess}</Text>
              <Text style={styles.rowLabel}>{curr.quickAccessDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Notifications */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>🔔</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.notifSettings}</Text>
              <Text style={styles.rowLabel}>{curr.notifSettingsDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

        </View>

        {/* Section 6: Support & Help */}
        <Text style={styles.sectionHeader}>{curr.supportHelp}</Text>
        <View style={[styles.itemsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          
          {/* Help Center */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>❓</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.helpCenter}</Text>
              <Text style={styles.rowLabel}>{curr.helpCenterDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* FAQs */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>💬</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.faqs}</Text>
              <Text style={styles.rowLabel}>{curr.faqsDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Contact Support */}
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>🎧</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.contactSupport}</Text>
              <Text style={styles.rowLabel}>{curr.contactSupportDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* App Info */}
          <View style={styles.rowItem}>
            <View style={[styles.rowIconBg, { backgroundColor: '#EBF3FF' }]}>
              <Text style={[styles.rowIcon, { color: '#004BCE' }]}>i</Text>
            </View>
            <View style={styles.rowDetails}>
              <Text style={[styles.secLabel, { color: dynamicText }]}>{curr.appInfo}</Text>
              <Text style={styles.rowLabel}>{curr.appInfoDesc}</Text>
            </View>
            <Text style={styles.chevronSmall}>&gt;</Text>
          </View>

        </View>

        {/* Section 7: Logout Card */}
        <TouchableOpacity 
          style={styles.logoutCard}
          activeOpacity={0.8}
          onPress={() => {
            setIsActionPending(true);
            setActionLabel(language === 'EN' ? 'Logging out...' : 'লগআউট করা হচ্ছে...');
            
            // Bypass API logout call, perform local logout immediately
            setTimeout(async () => {
              setIsActionPending(false);
              setActionLabel('');
              globalSession.isLoggedIn = false;
              await clearPersistentSession();
              router.replace('/');
            }, 1000);
          }}
        >
          <View style={styles.logoutIconBg}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </View>
          <View style={styles.rowDetails}>
            <Text style={styles.logoutText}>{curr.logout}</Text>
            <Text style={styles.logoutSubtext}>{curr.logoutDesc}</Text>
          </View>
        </TouchableOpacity>

        {/* Extra spacer for scroll clearance */}
        <View style={{ height: 100 }} />

      </ScrollView>

      {/* Bottom Sticky Tab Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}>
          <Text style={styles.navIconInactive}>🏠</Text>
          <Text style={styles.inactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/transactions')}>
          <Text style={styles.navIconInactive}>📄</Text>
          <Text style={styles.inactive}>Transactions</Text>
        </TouchableOpacity>

        <View style={styles.centerGap}/>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/services')}>
          <Text style={styles.navIconInactive}>📦</Text>
          <Text style={styles.inactive}>Services</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/profile')}>
          <Text style={styles.navIconActive}>👤</Text>
          <Text style={styles.active}>Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scanWrap} onPress={() => router.push('/scan')} activeOpacity={0.9}>
        <View style={styles.scanBtn}>
          <Image
            source={require('../../assets/qr.png')}
            style={styles.scanIconImage}
          />
        </View>
        <Text style={styles.scanText}>Scan</Text>
      </TouchableOpacity>

      {/* Loader Modal Overlay */}
      {isActionPending && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0A1F44" />
            <Text style={styles.loaderText}>{actionLabel}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggle: {
    padding: 4,
  },
  themeIcon: {
    fontSize: 20,
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
  contentScroll: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 110, // increased for sticky navbar spacing
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E3FF',
  },
  avatarSilhouette: {
    fontSize: 32,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    backgroundColor: '#E7F9F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#00C853',
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  gmailVerifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  gmailVerifyCheck: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 10,
    marginRight: 4,
  },
  gmailVerifyText: {
    color: '#00C853',
    fontSize: 11,
    fontWeight: '600',
  },
  chevronRight: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 10,
    paddingLeft: 4,
  },
  itemsCard: {
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#0D1A30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowIcon: {
    fontSize: 16,
  },
  rowDetails: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    color: '#777',
    fontWeight: '500',
  },
  rowVal: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  secLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  prefValText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004BCE',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  chevronSmall: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: 'bold',
  },
  rowBadgeGreen: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  rowBadgeGreenText: {
    fontSize: 10,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  rowBadgeBlue: {
    backgroundColor: '#EBF3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  rowBadgeBlueText: {
    fontSize: 10,
    color: '#004BCE',
    fontWeight: 'bold',
  },
  upcomingBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  upcomingBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
  },
  nidCalloutBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  infoBadgeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#004BCE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nidCalloutText: {
    fontSize: 11,
    color: '#004BCE',
    fontWeight: '600',
    flex: 1,
  },
  stateBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  stateBadgeActive: {
    backgroundColor: '#E8F8F0',
  },
  stateBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
  },
  stateBadgeTextActive: {
    color: '#27AE60',
  },
  prefDisclaimer: {
    fontSize: 11,
    color: '#888',
    paddingHorizontal: 4,
    marginTop: -8,
    marginBottom: 15,
    lineHeight: 16,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE3E3',
    borderRadius: 22,
    padding: 16,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  logoutIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EB5757',
  },
  logoutSubtext: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F0F2F6',
    paddingBottom: 8,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navIconActive: { fontSize: 22, color: '#0A1F44' },
  navIconInactive: { fontSize: 22, color: '#8A99AD', opacity: 0.8 },
  active: { color: '#0A1F44', fontSize: 11, fontWeight: '700', marginTop: 4 },
  inactive: { color: '#8A99AD', fontSize: 11, fontWeight: '500', marginTop: 4 },
  centerGap: { width: 60 },
  scanWrap: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  scanBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  scanIconImage: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  scanText: { fontSize: 11, fontWeight: '700', color: '#0A1F44', marginTop: 5 },
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
});
