import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { globalSession } from '../../constants/auth';
import { authApiService } from '../../services/api';

export default function AmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    name?: string; 
    phone?: string; 
    initial?: string; 
    avatarColor?: string; 
  }>();

  // Fallback to "Piyash" as seen in send.png
  const name = params.name || 'Piyash';
  const phone = params.phone || '01846 001591';
  const initial = params.initial || 'P';
  const avatarColor = params.avatarColor || '#4CAF50';

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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
    // Limit amount to 6 digits (plus optional decimal)
    if (amount.replace('.', '').length >= 6) return;
    
    // Handle decimal points
    if (num === '.') {
      if (amount.includes('.')) return;
      if (amount === '') {
        setAmount('0.');
        return;
      }
    }
    
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

  const isValid = amount.length > 0 && parseFloat(amount) > 0;

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: '/send/send-money-confirm',
      params: {
        amount,
        name,
        phone,
        initial,
        avatarColor,
        note
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1F44" />
      
      {/* Royal Blue Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send Money</Text>
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
        <Text style={styles.chevron}>&gt;</Text>
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

      {/* Note Card */}
      <View style={styles.noteCard}>
        <Text style={styles.noteIcon}>📝</Text>
        <TextInput 
          placeholder="Add a note (optional)" 
          placeholderTextColor="#999"
          value={note}
          onChangeText={text => {
            if (text.length <= 50) setNote(text);
          }}
          style={styles.noteInput}
        />
        <Text style={styles.noteLength}>{note.length}/50</Text>
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
          <TouchableOpacity style={styles.key} onPress={() => addNumber('.')} activeOpacity={0.6}>
            <Text style={styles.keyText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => addNumber('0')} activeOpacity={0.6}>
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.key} onPress={() => deleteNumber()} activeOpacity={0.6}>
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Solid Blue Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, !isValid && styles.buttonDisabled]} 
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
    borderBottomLeftRadius: 36, 
    borderBottomRightRadius: 36,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 0,
    paddingBottom: 25,
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerSafeArea: {
    width: '100%'
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16,
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
    fontWeight: 'bold' 
  },
  headerPlaceholder: {
    width: 24,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { 
    color: "#fff", 
    fontSize: 18,
    fontWeight: "bold" 
  },
  userInfo: {
    flex: 1,
  },
  name: { 
    fontSize: 16,
    fontWeight: "bold",
    color: '#0A1F44'
  },
  number: { 
    color: "#8A99AD", 
    fontSize: 13,
    marginTop: 2
  },
  chevron: { 
    fontSize: 16, 
    color: '#CBD5E1', 
    fontWeight: 'bold' 
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  enterAmountLabel: {
    fontSize: 14,
    color: '#8A99AD',
    fontWeight: '600',
    marginBottom: 8,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0A1F44',
    textAlign: 'center',
  },
  takaSymbol: {
    fontSize: 36,
    color: '#0A1F44',
  },
  balancePill: {
    backgroundColor: '#E7F9F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  balanceText: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: '#0A1F44',
    fontWeight: '600',
    height: '100%',
  },
  noteLength: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  keypad: {
    paddingHorizontal: 30,
    marginTop: 'auto', // Push to the bottom beautifully
    marginBottom: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  key: {
    width: 80,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: "#0A1F44",
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
    elevation: 0,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16,
    fontWeight: "bold" 
  },
});
