import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';

export default function RechargeAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    name?: string; 
    phone?: string; 
    initial?: string; 
    avatarColor?: string; 
    operator?: string;
    operatorColor?: string;
  }>();

  // Fallbacks matching Screen 2 requirements
  const name = params.name || 'Manual Recharge';
  const phone = params.phone || '01753 838244';
  const initial = params.initial || '📱';
  const avatarColor = params.avatarColor || '#163D7A';
  const operatorName = params.operator || 'Grameenphone';
  const operatorColor = params.operatorColor || '#00A8FF';

  const [amount, setAmount] = useState('');
  const [rechargeType, setRechargeType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
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
    // Limit amount to 5 digits for recharge (typical recharges are up to 50,000 BDT)
    if (amount.length >= 5) return;
    
    // Prevent multiple leading zeros
    if (amount === '0') {
      setAmount(num);
      return;
    }

    setAmount(prev => prev + num);
  };

  const deleteNumber = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  // Typical mobile recharge ranges between 10 BDT and 5000 BDT in BD
  const amountVal = parseInt(amount, 10) || 0;
  const isValid = amount.length > 0 && amountVal >= 10 && amountVal <= 5000;

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: '/recharge/confirm',
      params: {
        amount,
        name,
        phone,
        initial,
        avatarColor,
        operator: operatorName,
        operatorColor,
        rechargeType
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
            <Text style={styles.headerTitle}>Mobile Recharge</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </View>

      {/* Selected Contact Card */}
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.number}>{phone}</Text>
        </View>
        <View style={[styles.operatorBadge, { backgroundColor: operatorColor + '15' }]}>
          <Text style={[styles.operatorBadgeText, { color: operatorColor }]}>{operatorName.split(' ')[0]}</Text>
        </View>
      </View>

      {/* Center Amount Section */}
      <View style={styles.amountContainer}>
        <Text style={styles.enterAmountLabel}>Enter Amount</Text>
        <Text style={styles.amountDisplay}>
          <Text style={styles.takaSymbol}>৳ </Text>
          {amount || '0'}
        </Text>
        
        {/* Soft Blue Balance Pill */}
        <View style={styles.balancePill}>
          <Text style={styles.balanceText}>
            Available Balance: {loadingBalance ? '...' : `৳ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
        </View>
      </View>

      {/* Prepaid / Postpaid Segmented Selector */}
      <View style={styles.selectorWrapper}>
        <View style={styles.selectorContainer}>
          <TouchableOpacity 
            style={[
              styles.selectorTab, 
              rechargeType === 'Prepaid' && { backgroundColor: operatorColor }
            ]}
            onPress={() => setRechargeType('Prepaid')}
            activeOpacity={0.8}
          >
            <Text 
              style={[
                styles.selectorTabText, 
                rechargeType === 'Prepaid' && styles.selectorTabTextActive
              ]}
            >
              Prepaid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.selectorTab, 
              rechargeType === 'Postpaid' && { backgroundColor: operatorColor }
            ]}
            onPress={() => setRechargeType('Postpaid')}
            activeOpacity={0.8}
          >
            <Text 
              style={[
                styles.selectorTabText, 
                rechargeType === 'Postpaid' && styles.selectorTabTextActive
              ]}
            >
              Postpaid
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Amount Presets */}
      <View style={styles.presetsContainer}>
        {['20', '50', '100', '200', '500'].map((preset) => {
          const isSelected = amount === preset;
          return (
            <TouchableOpacity 
              key={preset} 
              style={[
                styles.presetChip, 
                isSelected && { borderColor: operatorColor, backgroundColor: operatorColor + '10' }
              ]} 
              onPress={() => setAmount(preset)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.presetChipText, 
                  isSelected && { color: operatorColor, fontWeight: '700' }
                ]}
              >
                ৳{preset}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Keypad Grid */}
      <View style={styles.keypad}>
        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('1')} activeOpacity={0.6}>
            <Text style={styles.keyText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('2')} activeOpacity={0.6}>
            <Text style={styles.keyText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('3')} activeOpacity={0.6}>
            <Text style={styles.keyText}>3</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('4')} activeOpacity={0.6}>
            <Text style={styles.keyText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('5')} activeOpacity={0.6}>
            <Text style={styles.keyText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('6')} activeOpacity={0.6}>
            <Text style={styles.keyText}>6</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keypadRow}>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('7')} activeOpacity={0.6}>
            <Text style={styles.keyText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('8')} activeOpacity={0.6}>
            <Text style={styles.keyText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('9')} activeOpacity={0.6}>
            <Text style={styles.keyText}>9</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.keypadRow}>
          <View style={styles.emptyKey} />
          <TouchableOpacity style={styles.key} onPress={() => addNumber('0')} activeOpacity={0.6}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => deleteNumber()} activeOpacity={0.6}>
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: operatorColor }, 
            !isValid && styles.buttonDisabled
          ]} 
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F7F9FC" 
  },
  header: { 
    backgroundColor: "#0A1F44", 
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
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
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
  operatorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  operatorBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
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
    color: '#6B7280',
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
    color: '#00C853',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    padding: 4,
    width: '70%',
    justifyContent: 'space-between',
  },
  selectorTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  selectorTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 12,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  presetChipText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  keypad: {
    paddingHorizontal: 32,
    marginTop: 'auto',
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  key: {
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyKey: {
    width: 80,
    height: 50,
  },
  keyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A1F44',
  },
  deleteText: {
    fontSize: 24,
    color: '#0A1F44',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
    opacity: 0.6,
  },
  buttonText: { 
    color: "#FFFFFF", 
    fontSize: 16,
    fontWeight: "bold" 
  },
});
