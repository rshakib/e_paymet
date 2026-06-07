import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function CashOutScreen() {
  const router = useRouter();

  const checklistItems = [
    {
      id: 1,
      icon: '🔒',
      title: 'PIN Required',
      description: 'You must provide your account PIN to continue.',
    },
    {
      id: 2,
      icon: '📷',
      title: 'Face Authentication',
      description: 'Face authentication is required for identity verification.',
    },
    {
      id: 3,
      icon: '🫆',
      title: 'Biometric Verification',
      description: 'Biometric verification is required to complete transaction securely.',
    },
    {
      id: 4,
      icon: '🔢',
      title: 'Temporary Code',
      description: 'A temporary code will be generated, which must be shown to a bank officer.',
    },
    {
      id: 5,
      icon: '🕒',
      title: 'Valid for 5 Minutes',
      description: 'The code will remain valid for 5 minutes.',
    },
  ];

  const handleGenerateCode = () => {
    router.push('/cash-out/amount');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />

      {/* Royal Navy Header matching cash.png */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cash Out</Text>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🦅</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* Large Central Bank Emblem */}
        <View style={styles.emblemContainer}>
          <View style={styles.emblemBg}>
            <View style={styles.shield}>
              <Text style={styles.monumentIcon}>🏛️</Text>
            </View>
            <View style={styles.padlockBadge}>
              <Text style={styles.padlockIcon}>🔒</Text>
            </View>
          </View>
        </View>

        {/* Text Title & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Cash Out via Bank Only</Text>
          <Text style={styles.subTitle}>Cash Out is only possible through the bank.</Text>
        </View>

        {/* Checklist Items */}
        <View style={styles.checklistContainer}>
          {checklistItems.map(item => (
            <View key={item.id} style={styles.checkItem}>
              <View style={styles.iconWrapper}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={handleGenerateCode}
          activeOpacity={0.9}
        >
          <Text style={styles.generateButtonText}>Generate Code</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    backgroundColor: '#0A1F44', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
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
  emblemContainer: {
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 20,
  },
  emblemBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shield: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  monumentIcon: {
    fontSize: 50,
    color: '#FFFFFF',
    marginTop: -4,
  },
  padlockBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  padlockIcon: {
    fontSize: 16,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1F44',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  checklistContainer: {
    paddingHorizontal: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EBF3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 18,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
  },
  generateButton: {
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
  generateButtonText: {
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
});
