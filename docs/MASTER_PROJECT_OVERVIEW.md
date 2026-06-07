# MASTER_PROJECT_OVERVIEW.md

## 1. Project Introduction
NiroPay is a secure, high-fidelity mobile e-wallet and financial services application. The system provides Dhaka/Bangladesh region users with a digital ledger capable of executing person-to-person (P2P) transfers, mobile operator airtime top-ups, utility bill payments, and merchant store purchases using a double-layered cryptographic security envelope. The frontend is built on **React Native (Expo)** with file-based routing and a dark-blue modern corporate theme, while the backend leverages **FastAPI (Python)** connected to a **Supabase PostgreSQL** cloud instance.

---

## 2. Business Flow & User Journey

### A. User Registration Journey
1. The user launches the application and navigates to the Registration screen.
2. The user provides:
   * **Username** (mobile phone number)
   * **Full Name**
   * **Mobile Number** (for communication)
   * **National ID (NID) Number**
   * **Date of Birth**
   * **Activation Code** (6-digit physical coupon or voucher)
   * **PIN/Password** (4-to-6 digit security PIN)
   * **Biometric enrollment preferences** (Fingerprint, Face ID)
3. The frontend captures the device MAC Address and automatically derives registration keys:
   * **Key K2**: Salted password stretching using PBKDF2 with NID as salt.
   * **Key K1**: Hardware-bound HMAC key using MAC Address and biometric credentials.
4. The frontend sends these keys along with profile data in a securely encrypted outer payload to the `/auth/register` backend endpoint.
5. The backend registers the user in the database, grants a ৳5,000.00 signup balance, and binds the device.

### B. User Login Journey
1. The user logs in using their Username and PIN.
2. The frontend derives the PBKDF2 stretched PIN (K2) using their cached NID (if enrolled) or submits the credentials wrapped in a secure envelope to the `/auth/login` endpoint.
3. The backend validates K2, issues a session UUID token (`active_sessions`), and responds with the encrypted User Profile data.
4. The dashboard displays the user's details and active balance, which is obfuscated by default and revealed only when the user taps on it.

### C. Money Transfer Flow (Send Money / Merchant Payment)
1. The user selects a recipient or scans a QR code.
2. The user inputs an amount (e.g. ৳500).
3. The user confirms details on the Breakdown Screen and performs biometric authentication (Fingerprint / Face ID).
4. If the transaction exceeds ৳5,000, the front camera modal activates to scan facial geometry and match it against the locally stored template.
5. The frontend generates a Layer 2 Transaction Packet containing:
   * **Message M**: `Receiver:<phone>|Amt:<amount>`
   * **Integrity Signature F1**: `HMAC-SHA256(M, K1)`
6. The frontend derives an AES-256 key from K2, BP (fingerprint hash), and the current timestamp `T`. It encrypts `M|F1` with this key.
7. The encrypted payload is sent to the `/auth/transfer` endpoint.
8. The backend decrypts the payload, verifies the HMAC integrity, checks for replay attacks, validates the user's daily spending limit (default ৳5,000.00), and invokes the database atomic stored procedure `process_transfer_secure` to complete the transfer.
9. A Success receipt page displays with a unique Transaction ID and confetti animations.

---

## 3. System Architecture

### A. Frontend Architecture
The client is structured as an **Expo Router** Single Page Application.
* **Routing**: File-based Stack router inside `src/app/`.
* **State Management**: React state hooks (`useState`, `useEffect`) and global volatile session object `globalSession` stored in `src/constants/auth.ts`.
* **Network Client**: A custom fetch wrapper in `src/services/api.ts` executing HTTP requests. It uses:
  * `apiClient.postSecure` for endpoints requiring Layer 1 outer envelope encryption.
  * `apiClient.get` and `apiClient.post` for standard endpoints.
* **Hardware Sensors**:
  * `expo-local-authentication` for Touch ID / Face ID hardware fingerprint scanners.
  * `expo-camera` for QR scanner viewfinder capture and high-value face template validation.
  * `expo-device` for identifying hardware vendor details used in MAC address spoofing.
  * `expo-secure-store` to lock the face template and session keys.

### B. Backend Architecture
The backend is a **FastAPI** Python application hosted with uvicorn.
* **Server**: FastAPI handles route definition, requests validation via Pydantic schemas, and Dependency Injection.
* **Volatile Session Store**: In-memory dictionary mapping session UUID tokens to usernames.
* **Security Handler**: `CryptoEngine` in `backend/crypto.py` handles:
  * AES-256-CBC decryption of the outer envelope.
  * SHA-256 PBKDF2 password stretching.
  * HMAC-SHA256 verification of Layer 2 payloads.
* **DB Client**: psycopg2 handles direct Postgres connection pooled execution for atomic operations, while Supabase Client executes basic CRUD queries.

### C. Database Architecture
Hosted on **Supabase PostgreSQL**.
* **Tables**:
  * `profiles`: Stores user registration details, stretched password keys, fingerprint biometric credentials, and spending limit status.
  * `accounts`: Stores active balances, profile ID mappings, and account activation flags.
  * `transactions`: Audits all transfer histories, statuses (success, aborted), and error logs.
  * `bills`: Contains utility company statements (DESCO, Link3) linked to profiles.
* **Database Logic**: An atomic PL/pgSQL function `process_transfer_secure` handles transaction validation, balance subtraction/addition, limit check, replay attack checking, and logs insertion under a write-ahead row lock (`FOR UPDATE`).

### D. Security Architecture
The system employs a multi-tiered security architecture:
```
Client Request
  |
  +--> [Layer 1: Envelope Security]
  |      Encrypts entire body with AES-256-CBC using server-shared secret key.
  |      Includes HMAC signature of the encrypted payload + timestamp + random nonce.
  |
  +--> [Layer 2: Transaction Security] (e.g. /auth/transfer)
         Payload (M) = "Receiver:Bob|Amt:1000"
         HMAC (F1) = HMAC-SHA256(M, K1) where K1 is hardware-bound.
         AES Key = HMAC-SHA256(BP + T, K2)
         Payload (payload) = AES-256-CBC(M|F1, AES Key)
```

1. **Outer Envelope (Layer 1)**: Prevent sniffing and parameter tampering. Every API payload is encrypted and signed with a shared key. Replay attacks are prevented via a timestamp-nonce check.
2. **Inner Transaction Security (Layer 2)**: Core payment operations are double-encrypted. A compromised outer envelope cannot compromise the transaction since the inner payload is encrypted using keys derived from local biometric parameters (`BP`), the user's PIN/Password (`K2`), and the hardware-bound signature key (`K1`).
3. **Replay Protection**: Timestamps are checked for freshness (±180s vs server time). The database verifies that the incoming timestamp `T` is strictly greater than the user's previous recorded timestamp `last_t`.
4. **Device Binding**: Keys are generated using hardware properties (MAC address, device IDs) making it impossible to perform transactions from cloned sessions or unauthorized devices.
