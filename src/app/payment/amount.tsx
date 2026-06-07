import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';

export default function PaymentAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    name?: string; 
    phone?: string; 
    color?: string;
    bgColor?: string;
    initial?: string; 
  }>();

  const name = params.name || 'Nadir Optics';
  const phone = params.phone || '01712924659';
  const color = params.color || '#2F80ED';
  const bgColor = params.bgColor || '#EBF3FF';
  const initial = params.initial || '🛍️';

  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const username = globalSession.registeredUser.username;
        if (!username) return;
        const res = await authApiService.getUserProfile(username);
        if (res.success && res.data) {
          setBalance(res.data.user.balance);
        }
      } catch (err) {
        console.error('Failed to load balance:', err);
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, []);

  const addNumber = (num: string) => {
    // Prevent adding multiple decimal points
    if (num === '.' && amount.includes('.')) return;

    // Prevent typing after 2 decimal places
    if (amount.includes('.')) {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    // Limit absolute digits to 7
    if (amount.replace('.', '').length >= 7) return;

    // Prevent multiple leading zeros
    if (amount === '0' && num !== '.') {
      setAmount(num);
      return;
    }

    setAmount(prev => prev + num);
  };

  const deleteNumber = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const amountVal = parseFloat(amount) || 0;
  const isValid = amount.length > 0 && amountVal > 0;

  const handleProceed = () => {
    if (!isValid) return;
    router.push({
      pathname: '/payment/confirm',
      params: {
        amount,
        name,
        phone,
        color,
        bgColor,
        initial
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Curved Royal Blue Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Payment</Text>
              <View style={styles.headerPlaceholder} />
            </View>
        </SafeAreaView>
      </View>

      {/* Selected Merchant Recipient Card */}
      <View style={styles.recipientCardContainer}>
        <View style={styles.recipientCard}>
          <View style={[styles.avatarCircle, { backgroundColor: bgColor }]}>
            <Text style={[styles.avatarIcon, { color: color }]}>{initial}</Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.toLabel}>To</Text>
            <Text style={styles.recipientName}>{name}</Text>
            <Text style={styles.recipientPhone}>{phone}</Text>
          </View>
        </View>
      </View>

      {/* Center Amount Section */}
      <View style={styles.amountContainer}>
        <Text style={styles.enterAmountLabel}>Enter Amount</Text>
        <Text style={styles.amountDisplay}>
          <Text style={styles.takaSymbol}>৳ </Text>
          {amount || '0'}
          <Text style={styles.cursor}>|</Text>
        </Text>
        
        {/* Soft Blue Balance Pill */}
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>
            Available Balance: {loadingBalance ? '...' : `৳ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
        </View>
      </View>

      {/* Keypad and Proceed Button aligned at bottom */}
      <View style={styles.footerContainer}>
        
        {/* Custom Numeric Grid Keypad */}
        <View style={styles.keypadGrid}>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('1')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('2')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('3')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>3</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('4')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('5')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('6')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>6</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('7')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('8')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('9')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>9</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('.')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={() => addNumber('0')} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keypadButton} onPress={deleteNumber} activeOpacity={0.6}>
              <Text style={styles.keypadButtonText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Proceed Button */}
        <TouchableOpacity 
          style={[styles.proceedButton, !isValid && styles.disabledButton]} 
          onPress={handleProceed}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedText}>Proceed</Text>
          <Text style={styles.proceedArrow}>→</Text>
        </TouchableOpacity>
      </View>

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
  recipientCardContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarIcon: {
    fontSize: 18,
  },
  recipientInfo: {
    flex: 1,
  },
  toLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  recipientPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  amountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
    marginTop: 24,
  },
  enterAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0A1F44',
    textAlign: 'center',
  },
  takaSymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  cursor: {
    fontSize: 36,
    color: '#00C2FF',
    fontWeight: '200',
  },
  balancePill: {
    backgroundColor: '#E7F9F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#00C85320',
  },
  balanceText: {
    fontSize: 13,
    color: '#00C853',
    fontWeight: '600',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingTop: 20,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 10,
  },
  keypadGrid: {
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
  },
  keypadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginHorizontal: 10,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  proceedButton: {
    backgroundColor: '#0A1F44',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#B3C0D6',
  },
  proceedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  proceedArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
