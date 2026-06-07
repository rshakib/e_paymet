import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AuthScreen() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("Biometrics not available", ToastAndroid.SHORT);
      }
      return;
    }

    setIsVerifying(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Transaction',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        router.push('/send/success');
      } else {
        if (Platform.OS === 'android') {
          ToastAndroid.show("Authentication failed", ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Payment</Text>
      <Text style={styles.subtitle}>Use fingerprint or face to authorize</Text>

      <TouchableOpacity 
        style={styles.fingerprintBox} 
        onPress={handleBiometricAuth}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" size="large" />
        ) : (
          <Text style={styles.fingerprint}>🫆</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>OR ENTER PIN</Text>

      <View style={styles.pinRow}>
        <View style={styles.dot}/>
        <View style={styles.dot}/>
        <View style={styles.dot}/>
        <View style={styles.dot}/>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/send/success')}>
        <Text style={styles.buttonText}>Confirm with PIN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A1F44',
    marginBottom: 8
  },
  subtitle: {
    color: '#666',
    marginBottom: 40,
    fontSize: 14,
  },
  fingerprintBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0A1F44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fingerprint: {
    fontSize: 40,
  },
  orText: {
    marginVertical: 20,
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pinRow: {
    flexDirection: 'row',
    marginBottom: 40
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0A1F44',
    marginHorizontal: 10,
    opacity: 0.3,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0A1F44',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#0A1F44',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
