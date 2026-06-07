# COMPLETE_SECURITY_DOCUMENTATION.md

---

## 1. Cryptographic Workflows

### A. Envelope Encapsulation (Layer 1 Outer Security)
To protect all communications against parameter tampering and interception, payloads are wrapped in a secure outer envelope:
* **Client Encryption Path**: `apiClient.postSecure` in [api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L126)
  * Stringifies body.
  * Encrypts string via `CryptoJS.AES.encrypt` using a 256-bit key derived from the first 32 characters of `SECRET_KEY`.
  * The IV is generated dynamically as a random 16-byte array.
  * Generates an integrity signature: `HMAC-SHA256(payload | timestamp | nonce, SECRET_KEY)`.
  * Returns payload formatted as `IV_BASE64:CIPHERTEXT_BASE64`.
* **Server Decryption Path**: `CryptoEngine.decrypt_outer_envelope` in [crypto.py](file:///E:/Apps/NiroPay/backend/crypto.py#L73)
  * Extracts envelope fields (`payload`, `hmac`, `nonce`, `timestamp`).
  * Re-generates signature `expected_hmac = HMAC-SHA256(payload | timestamp | nonce, SECRET_KEY)`.
  * Uses constant-time comparison `compare_digest` to verify signature match.
  * Splits payload by `:` to get `IV` and `CIPHERTEXT`.
  * Decrypts ciphertext via PyCryptodome `AES.MODE_CBC` using `SECRET_KEY` and deserializes the decrypted JSON.

### B. Transaction Security (Layer 2 Inner Security)
Critical financial transactions (such as P2P transfers) are double-encrypted. This ensures that even if the outer layer is compromised, the transaction itself remains secure:
* **Client Encryption Path**: `security.encryptTransaction` in [api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L76)
  * Message Payload: `M = "Receiver:<phone>|Amt:<amount>"`
  * Integrity Signature: `F1 = HMAC-SHA256(M, K1)` where `K1` is the user's hardware-bound key.
  * Key Derivation: Derives an AES-256 key: `AESKey = HMAC-SHA256(BP + T, K2_stretched)` where `BP` is the local biometric template hash, `T` is the current Unix timestamp, and `K2_stretched` is the stretched password key.
  * Encrypts the payload `M | F1` using AES-256-CBC and outputs `payload`, `iv`, and `T`.
* **Server Decryption Path**: `CryptoEngine.decrypt_data` in [crypto.py](file:///E:/Apps/NiroPay/backend/crypto.py#L50)
  * Derives the same AES key: `AESKey = HMAC-SHA256(BP + T, K2_stretched)` using the user's stored parameters in `profiles`.
  * Decrypts the inner payload using the key and IV.
  * Parses the decrypted string: splits by `|` to separate the message `M` and signature `F1`.
  * Verifies integrity: checks if `F1` matches `HMAC-SHA256(M, K1)` using the user's stored `hmac_key_k1`.

---

## 2. Multi-Factor Workflows

### A. User Registration
* **Client Code Path**: `authApiService.register` in [api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L349)
  * Captures MAC address: `mac = security.getDeviceID()`.
  * Derives biometric fingerprint template hash: `bp_hash = SHA256("biometric-fingerprint-" + username)`.
  * Encapsulates registration fields in the Layer 1 envelope.
* **Server Code Path**: `auth_register` in [app.py](file:///E:/Apps/NiroPay/backend/app.py#L805)
  * Decrypts the registration request.
  * Derives key K2: `K2 = PBKDF2-SHA256(pin, NID)` with 100,000 iterations.
  * Derives key K1: `K1 = HMAC-SHA256(activation_code | NID, MAC | bp_hash)`. This binds the registration keys to the physical device.
  * Inserts the user record into the database.

### B. User Login
* **Client Code Path**: `authApiService.login` in [api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L377)
  * Encapsulates credentials in the Layer 1 envelope.
* **Server Code Path**: `auth_login` in [app.py](file:///E:/Apps/NiroPay/backend/app.py#L902)
  * Decrypts the login request.
  * Validates identity: derives K2 from user entered password and stored NID. Checks if it matches `profiles.password_key_k2`.
  * Supports legacy migrations: if the stored value is plaintext, updates the database with a PBKDF2-stretched PIN.
  * Generates session token: creates UUID `access_token` and inserts it into `active_sessions`.
  * Returns user credentials (`k1`, `k2`, `bp`, `last_t`) to the client.

### C. Fingerprint Verification (Biometrics)
* **Client Code Path**: `handleBiometricAuth` in [send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx#L161)
  * Verifies hardware capabilities: checks `LocalAuthentication.hasHardwareAsync()` and `LocalAuthentication.isEnrolledAsync()`.
  * Displays biometric dialog: calls `LocalAuthentication.authenticateAsync()`.
  * If successful, checks the transaction amount:
    * Amount <= ৳5,000: Executes the transaction.
    * Amount > ৳5,000: Requests camera permission and prompts for face verification.

### D. Face Verification (High-Value Check)
* **Client Code Path**: `handleCaptureFace` in [send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx#L105)
  * Active for transactions exceeding ৳5,000.
  * Captures facial landmarks: calls `cameraRef.current.takePictureAsync()`.
  * Compares face: retrieves the registered face template from `SecureStore` using the key `face_landmarks_template` and compares it to the captured image.
  * On match, executes the transaction.

---

## 3. Replay Protection & Device Binding

### A. Replay Protection (Client and DB Sequence Checks)
Replay attacks are prevented by checking both time freshness and sequence numbers:
1. **Time Freshness Check**: The backend verifies that the client timestamp `T` is within 180 seconds of the server's current time.
2. **Sequence Check**: The database check is handled inside `process_transfer_secure`. It verifies that the incoming timestamp `T` is strictly greater than the user's previously recorded timestamp `last_t`. If `T <= last_t`, the transaction is aborted with the reason `"Replay attack detected"`.

### B. Device Binding
Transactions can only be executed from the registered device. Keys are derived using physical device properties:
* **Key K1** is derived from the device's MAC Address and biometric credentials.
* **Biometric Enrollment** creates a unique template hash `bp_hash` linked to the hardware.
* **Key K2** is derived using the user's National ID (NID).
If a transaction request is made from a different device, the derived keys will not match, causing decryption or HMAC validation to fail.
