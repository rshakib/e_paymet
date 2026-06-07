import hashlib
import hmac
import base64
import json
import binascii
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

class CryptoEngine:
    def __init__(self):
        # AES ব্লকের সাইজ ১৬ বাইট
        self.block_size = 16

    def generate_hmac(self, key_k1, message):
        """মেসেজ M এবং কি K1 ব্যবহার করে F1/F2 তৈরি করা"""
        byte_key = key_k1.encode('utf-8')
        byte_message = message.encode('utf-8')
        h = hmac.new(byte_key, byte_message, hashlib.sha256)
        return h.hexdigest()

    def stretch_password(self, password, nid):
        """PBKDF2-SHA256 ব্যবহার করে পাসওয়ার্ড স্ট্রেচ করা (NID কে সল্ট হিসেবে ব্যবহার করে)"""
        salt = nid.encode('utf-8')
        iterations = 100000
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
        return binascii.hexlify(dk).decode('utf-8')

    def _derive_aes_key(self, password_k2, fingerprint_bp, last_t):
        """K2, BP এবং T থেকে একটি ৩২-বাইটের AES কী তৈরি করা (HMAC-SHA256)"""
        message = f"{fingerprint_bp}{last_t}"
        byte_key = password_k2.encode('utf-8')
        byte_message = message.encode('utf-8')
        h = hmac.new(byte_key, byte_message, hashlib.sha256)
        return h.digest()

    def encrypt_data(self, message, f1, k2, bp, t):
        """M + F1 কে K2, BP, T দিয়ে এনক্রিপ্ট করা (Pipe-delimited)"""
        combined_data = f"{message}|{f1}"
        key = self._derive_aes_key(k2, bp, t)

        cipher = AES.new(key, AES.MODE_CBC)
        iv = cipher.iv # ইনপুট ভেক্টর

        ct_bytes = cipher.encrypt(pad(combined_data.encode(), self.block_size))

        # IV এবং সাইফারটেক্সট আলাদাভাবে পাঠানো হতে পারে, 
        # তবে এই ফাংশনটি আগের মতো সমন্বিত রিটার্ন দিতে পারে অথবা নতুন ফরম্যাট অনুযায়ী
        return {"payload": base64.b64encode(ct_bytes).decode('utf-8'), "iv": base64.b64encode(iv).decode('utf-8')}

    def decrypt_data(self, encrypted_payload_base64, iv_base64, k2, bp, t):
        """Ciphertext ডিক্রিপ্ট করে M এবং F1 উদ্ধার করা (Pipe-delimited)"""
        try:
            ct = base64.b64decode(encrypted_payload_base64)
            iv = base64.b64decode(iv_base64)
            key = self._derive_aes_key(k2, bp, t)

            cipher = AES.new(key, AES.MODE_CBC, iv)
            pt_bytes = unpad(cipher.decrypt(ct), self.block_size)

            decrypted_string = pt_bytes.decode('utf-8')
            parts = decrypted_string.split('|')
            if len(parts) < 2:
                return None

            f1 = parts.pop()
            m = "|".join(parts)

            return {"M": m, "F1": f1}
        except Exception as e:
            print(f"Decryption error: {e}")
            return None

    def decrypt_outer_envelope(self, envelope_dict: dict, secret_key: str) -> dict:
        """Decrypt the outer secure envelope sent by apiClient.postSecure"""
        try:
            payload = envelope_dict.get('payload')
            hmac_val = envelope_dict.get('hmac')
            nonce = envelope_dict.get('nonce')
            timestamp = envelope_dict.get('timestamp')

            if not all([payload, hmac_val, nonce, timestamp is not None]):
                print("Missing envelope parameters")
                return None

            # Verify integrity HMAC
            integrity_str = f"{payload}|{timestamp}|{nonce}"
            byte_key = secret_key.encode('utf-8')
            byte_message = integrity_str.encode('utf-8')
            h = hmac.new(byte_key, byte_message, hashlib.sha256)
            expected_hmac = h.hexdigest()

            if not hmac.compare_digest(expected_hmac, hmac_val):
                print("Outer envelope HMAC mismatch")
                return None

            # Decrypt payload
            iv_b64, ct_b64 = payload.split(':')
            iv = base64.b64decode(iv_b64)
            ct = base64.b64decode(ct_b64)
            key = secret_key[:32].encode('utf-8')

            cipher = AES.new(key, AES.MODE_CBC, iv)
            pt_bytes = unpad(cipher.decrypt(ct), self.block_size)
            decrypted_str = pt_bytes.decode('utf-8')

            return json.loads(decrypted_str)
        except Exception as e:
            print(f"Outer envelope decryption failed: {e}")
            return None

    def encrypt_outer_envelope(self, data_dict: dict, secret_key: str) -> dict:
        """Encrypt response data in the outer secure envelope format for apiClient.postSecure"""
        try:
            data_str = json.dumps(data_dict)
            key = secret_key[:32].encode('utf-8')
            cipher = AES.new(key, AES.MODE_CBC)
            iv = cipher.iv

            ct_bytes = cipher.encrypt(pad(data_str.encode('utf-8'), self.block_size))
            iv_b64 = base64.b64encode(iv).decode('utf-8')
            ct_b64 = base64.b64encode(ct_bytes).decode('utf-8')
            payload = f"{iv_b64}:{ct_b64}"

            # Generate HMAC of payload
            byte_key = secret_key.encode('utf-8')
            byte_message = payload.encode('utf-8')
            h = hmac.new(byte_key, byte_message, hashlib.sha256)
            generated_hmac = h.hexdigest()

            return {
                "payload": payload,
                "hmac": generated_hmac
            }
        except Exception as e:
            print(f"Outer envelope encryption failed: {e}")
            return None


