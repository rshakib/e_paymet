import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { globalSession } from '../constants/auth';

// 1. Configure your Backend API Endpoint URL
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
console.log('Resolved EXPO_PUBLIC_BACKEND_URL:', BACKEND_URL);

// 2. Security Constants (Must match backend/app.py)
const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_KEY || ''; 
if (!SECRET_KEY) {
  console.warn('CRITICAL: EXPO_PUBLIC_SECRET_KEY is not defined in environment variables!');
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/**
 * PERSISTENT SESSION HELPERS
 */
export const savePersistentSession = async (token: string, profile: any) => {
  try {
    await SecureStore.setItemAsync('niropay_auth_token', token);
    await SecureStore.setItemAsync('niropay_user_profile', JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save session to SecureStore', e);
  }
};

export const clearPersistentSession = async () => {
  try {
    await SecureStore.deleteItemAsync('niropay_auth_token');
    await SecureStore.deleteItemAsync('niropay_user_profile');
    authToken = null;
  } catch (e) {
    console.error('Failed to clear session from SecureStore', e);
  }
};

interface APIResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * SECURE COMMUNICATION UTILS (AES-256 + HMAC + Nonce)
 */
const security = {
  encrypt(data: string): string {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.substring(0, 32));
    
    // Generate a random IV manually to avoid React Native's missing native crypto module error
    const words: number[] = [];
    for (let i = 0; i < 4; i++) {
      words.push((Math.random() * 0x100000000) | 0);
    }
    const iv = CryptoJS.lib.WordArray.create(words, 16);

    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const ctBase64 = encrypted.toString();
    return `${ivBase64}:${ctBase64}`;
  },

  decrypt(encryptedData: string): string | null {
    try {
      const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.substring(0, 32));
      const [ivBase64, ctBase64] = encryptedData.split(':');
      const iv = CryptoJS.enc.Base64.parse(ivBase64);
      const decrypted = CryptoJS.AES.decrypt(ctBase64, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error('Decryption failed', e);
      return null;
    }
  },

  generateHMAC(payload: string): string {
    const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
    return CryptoJS.HmacSHA256(payload, key).toString(CryptoJS.enc.Hex);
  },

  async getDeviceID(): Promise<string> {
    const id = `${Device.brand}-${Device.modelName}-${Device.osInternalBuildId || 'TEST'}`;
    return `A4:5E:60:${id.substring(0, 2)}:${id.substring(2, 4)}:AB`.toUpperCase();
  },

  encryptLayer2(
    m: string,
    k1: string,
    k2Stretched: string,
    bpHash: string
  ) {
    // Diagnostic logging (No values)
    console.log("[SECURITY] encryptLayer2 Check:", {
      hasK1: !!k1,
      hasK2: !!k2Stretched,
      hasBP: !!bpHash,
      messageLen: m?.length
    });

    if (!k1 || !k2Stretched || !bpHash) {
      throw new Error("Security profile incomplete. Please re-login.");
    }

    const T = Math.floor(Date.now() / 1000);
    
    // Derive AES key using BP_hash and T
    const aesKeyHex = CryptoJS.HmacSHA256(bpHash + T.toString(), k2Stretched).toString(CryptoJS.enc.Hex);
    const aesKey = CryptoJS.enc.Hex.parse(aesKeyHex);

    // F1: Integrity hash
    const f1 = CryptoJS.HmacSHA256(m, k1).toString(CryptoJS.enc.Hex);
    
    // Payload combined (M|F1)
    const payload = `${m}|${f1}`;

    const words: number[] = [];
    for (let i = 0; i < 4; i++) {
      words.push((Math.random() * 0x100000000) | 0);
    }
    const iv = CryptoJS.lib.WordArray.create(words, 16);
    
    const encrypted = CryptoJS.AES.encrypt(payload, aesKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
    const ctBase64 = encrypted.toString();

    return {
      payload: ctBase64,
      iv: ivBase64,
      T: T
    };
  }
};

export const apiClient = {
  /**
   * Performs a SECURE POST request with Encryption and Integrity checks
   */
  async postSecure<T>(endpoint: string, data: object): Promise<APIResponse<T>> {
    try {
      const jsonStr = JSON.stringify(data);
      const payload = security.encrypt(jsonStr);
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = Math.random().toString(36).substring(7);
      
      const integrityString = `${payload}|${timestamp}|${nonce}`;
      const hmac = security.generateHMAC(integrityString);

      const secureBody = {
        payload,
        hmac,
        nonce,
        timestamp
      };

      const url = `${BACKEND_URL}${endpoint}`;
      console.log("REQUEST URL:", url);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(secureBody)
      });
      console.log("API Response:", response);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.message || errData.detail || `Server error ${response.status}`;

        if (errData.traceback) {
          console.log("Backend Exception Stack Trace:\n", errData.traceback);
        }
        
        if (response.status === 401 && endpoint !== '/auth/login') {
          globalSession.isLoggedIn = false;
          setAuthToken(null);
        }
        
        return {
          data: null,
          error: errMsg,
          success: false
        };
      }

      const resJson = await response.json();
      
      if (resJson.payload && resJson.hmac) {
        const decryptedStr = security.decrypt(resJson.payload);
        if (!decryptedStr) throw new Error('Response decryption failed');
        return {
          data: JSON.parse(decryptedStr) as T,
          error: null,
          success: true
        };
      }

      return {
        data: resJson as T,
        error: null,
        success: true
      };
    } catch (e: any) {
      console.warn(`Secure API Connection to ${endpoint} failed.`, e);
      return {
        data: null,
        error: 'CONNECTION_FAILURE',
        success: false
      };
    }
  },

  /**
   * Performs a standard GET request with Authorization header
   */
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const url = `${BACKEND_URL}${endpoint}`;
      console.log("REQUEST GET URL:", url);

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.message || errData.detail || `Server error ${response.status}`;
        
        if (response.status === 401) {
          globalSession.isLoggedIn = false;
          setAuthToken(null);
        }
        
        return {
          data: null,
          error: errMsg,
          success: false
        };
      }

      const resJson = await response.json();
      
      if (resJson.payload && resJson.hmac) {
        const decryptedStr = security.decrypt(resJson.payload);
        if (!decryptedStr) throw new Error('Response decryption failed');
        return {
          data: JSON.parse(decryptedStr) as T,
          error: null,
          success: true
        };
      }

      return {
        data: resJson as T,
        error: null,
        success: true
      };
    } catch (e: any) {
      console.warn(`API GET Connection to ${endpoint} failed.`, e);
      return {
        data: null,
        error: 'CONNECTION_FAILURE',
        success: false
      };
    }
  },

  /**
   * Performs a standard POST request with Authorization header
   */
  async post<T>(endpoint: string, data: object): Promise<APIResponse<T>> {
    try {
      const url = `${BACKEND_URL}${endpoint}`;
      console.log("REQUEST POST URL:", url);
      console.log("API URL:", url);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      console.log("API Response:", response);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.message || errData.detail || `Server error ${response.status}`;
        console.log("Full error response body:", errData);
        console.log("HTTP status code:", response.status);
        if (errData.traceback) {
          console.log("Backend Exception Stack Trace:\n", errData.traceback);
        }
        
        if (response.status === 401) {
          globalSession.isLoggedIn = false;
          setAuthToken(null);
        }
        
        return {
          data: null,
          error: errMsg,
          success: false
        };
      }

      const resJson = await response.json();
      return {
        data: resJson as T,
        error: null,
        success: true
      };
    } catch (e: any) {
      console.warn(`API POST Connection to ${endpoint} failed.`, e);
      return {
        data: null,
        error: 'CONNECTION_FAILURE',
        success: false
      };
    }
  }
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  balance: number;
  has_fingerprint: boolean;
  has_face_id: boolean;
  k1?: string;
  k2?: string;
  bp?: string;
  last_t?: number;
}

export const authApiService = {
  async register(profile: {
    username: string;
    pin: string;
    fullName: string;
    mobileNumber: string;
    nidNumber: string;
    dateOfBirth: string;
    hasFingerprint: boolean;
    hasFaceId: boolean;
    activationCode: string;
  }): Promise<APIResponse<{ success: boolean; message: string }>> {
    const mac = await security.getDeviceID();
    const bp_hash = CryptoJS.SHA256(`biometric-fingerprint-${profile.username}`).toString(CryptoJS.enc.Hex);
    return await apiClient.postSecure<{ success: boolean; message: string }>('/auth/register', {
      username: profile.username,
      pin: profile.pin,
      full_name: profile.fullName,
      mobile_number: profile.mobileNumber,
      nid_number: profile.nidNumber,
      date_of_birth: profile.dateOfBirth,
      has_fingerprint: profile.hasFingerprint,
      has_face_id: profile.hasFaceId,
      mac_address: mac,
      activation_code: profile.activationCode,
      bp_hash: bp_hash
    });
  },

  async login(username: string, pin: string): Promise<APIResponse<{ access_token: string, user: UserProfile }>> {
    const mac = await security.getDeviceID();
    const response = await apiClient.postSecure<{ access_token: string, user: UserProfile }>('/auth/login', {
      username,
      pin,
      mac_address: mac
    });
    if (response.success && response.data) {
      setAuthToken(response.data.access_token);
    }
    return response;
  },

  async logout(): Promise<APIResponse<{ success: boolean; message: string }>> {
    const response = await apiClient.postSecure<{ success: boolean; message: string }>('/auth/logout', {});
    if (response.success) {
      setAuthToken(null);
    }
    return response;
  },

  async transfer(
    receiver: string,
    amount: number,
    k1: string,
    k2: string,
    bp: string
  ): Promise<APIResponse<{ status: string; message: string; new_balance?: number }>> {
    const sender = globalSession.registeredUser.username;
    const m = `Receiver:${receiver}|Amt:${amount}`;
    const layer2Packet = security.encryptLayer2(m, k1, k2, bp);
    
    return await apiClient.postSecure<{ status: string; message: string; new_balance?: number }>('/auth/transfer', {
      username: sender,
      payload: layer2Packet.payload,
      iv: layer2Packet.iv,
      T: layer2Packet.T
    });
  },

  async getUserProfile(username: string): Promise<APIResponse<{ status: string; user: UserProfile }>> {
    return await apiClient.get<{ status: string; user: UserProfile }>(`/user/${username}`);
  },

  async getTransactions(username: string): Promise<APIResponse<{ status: string; transactions: any[] }>> {
    return await apiClient.get<{ status: string; transactions: any[] }>(`/transactions/${username}`);
  },

  async searchUsers(query: string): Promise<APIResponse<{ status: string; users: any[] }>> {
    return await apiClient.get<{ status: string; users: any[] }>(`/search-users?q=${encodeURIComponent(query)}`);
  },

  async checkReceiver(username: string): Promise<APIResponse<{ status: string; username: string; full_name?: string }>> {
    return await apiClient.get<{ status: string; username: string; full_name?: string }>(`/check-receiver/${encodeURIComponent(username)}`);
  },

  async matchContacts(phoneNumbers: string[]): Promise<APIResponse<{ status: string; matched_users: any[] }>> {
    return await apiClient.post<{ status: string; matched_users: any[] }>('/contacts/match', { phone_numbers: phoneNumbers });
  },

  async getBills(username: string): Promise<APIResponse<{ status: string; bills: any[] }>> {
    return await apiClient.get<{ status: string; bills: any[] }>(`/bills/${username}`);
  },

  async payBill(
    billId: string,
    k1: string,
    k2: string,
    bp: string
  ): Promise<APIResponse<{ status: string; message: string; new_balance?: number }>> {
    const sender = globalSession.registeredUser.username;
    // For bills, we fetch the amount from DB on backend, but we include it in M for integrity if needed
    // However, the backend rpc for bills only needs bill_id. 
    // Let's use a standard format for M.
    // Since bill amount is fixed in DB, we'll just sign the BillID and a dummy Amt or real if known.
    // The previous implementation didn't pass amount to payBill. 
    // I'll use "BillID:<id>|Amt:0" as a placeholder or fetch it if available.
    // Actually, I'll just use "BillID:<id>|Amt:0" for now as the backend will use the DB amount.
    const m = `BillID:${billId}|Amt:0`;
    const layer2Packet = security.encryptLayer2(m, k1, k2, bp);

    return await apiClient.postSecure<{ status: string; message: string; new_balance?: number }>('/bills/pay', {
      username: sender,
      payload: layer2Packet.payload,
      iv: layer2Packet.iv,
      T: layer2Packet.T
    });
  },

  async recharge(
    phone: string,
    amount: number,
    operator: string,
    k1: string,
    k2: string,
    bp: string
  ): Promise<APIResponse<{ status: string; message: string; new_balance?: number }>> {
    const sender = globalSession.registeredUser.username;
    const m = `Phone:${phone}|Amt:${amount}|Operator:${operator}`;
    const layer2Packet = security.encryptLayer2(m, k1, k2, bp);

    return await apiClient.postSecure<{ status: string; message: string; new_balance?: number }>('/auth/recharge', {
      username: sender,
      payload: layer2Packet.payload,
      iv: layer2Packet.iv,
      T: layer2Packet.T
    });
  },

  async merchantPayment(
    merchantUsername: string,
    amount: number,
    k1: string,
    k2: string,
    bp: string
  ): Promise<APIResponse<{ status: string; message: string; new_balance?: number }>> {
    const sender = globalSession.registeredUser.username;
    const m = `Merchant:${merchantUsername}|Amt:${amount}`;
    const layer2Packet = security.encryptLayer2(m, k1, k2, bp);

    return await apiClient.postSecure<{ status: string; message: string; new_balance?: number }>('/auth/merchant-payment', {
      username: sender,
      payload: layer2Packet.payload,
      iv: layer2Packet.iv,
      T: layer2Packet.T
    });
  },

  async getRechargeOperators(): Promise<APIResponse<{ status: string; operators: any[] }>> {
    return await apiClient.get<{ status: string; operators: any[] }>('/recharge/operators');
  }
};
