import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import LoginScreen from './login';
import { globalSession } from '../constants/auth';
import { setAuthToken } from '../services/api';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(globalSession.isLoggedIn);
  
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const token = await SecureStore.getItemAsync('niropay_auth_token');
        const profileStr = await SecureStore.getItemAsync('niropay_user_profile');

        if (token && profileStr) {
          const profile = JSON.parse(profileStr);
          globalSession.registeredUser = profile;
          globalSession.isLoggedIn = true;
          setAuthToken(token);
          setLoggedIn(true);
          console.log("[AUTH] Session rehydrated for:", profile.username);
        }
      } catch (e) {
        console.error("[AUTH] Rehydration failed", e);
      } finally {
        setIsReady(true);
      }
    };

    rehydrate();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (globalSession.isLoggedIn !== loggedIn) {
        setLoggedIn(globalSession.isLoggedIn);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [loggedIn]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1F44' }}>
        <ActivityIndicator size="large" color="#00C2FF" />
      </View>
    );
  }

  if (!loggedIn) {
    return (
      <LoginScreen 
        onLoginSuccess={() => {
          globalSession.isLoggedIn = true;
          setLoggedIn(true);
        }} 
      />
    );
  }

  return <DashboardScreen />;
}
