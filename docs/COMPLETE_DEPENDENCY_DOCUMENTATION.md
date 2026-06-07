# COMPLETE_DEPENDENCY_DOCUMENTATION.md

---

## 1. Frontend Dependencies (`package.json`)

### A. Core Frameworks
* **`react` & `react-native`**:
  * *Why Used*: Provides core interface component definitions and native runtime bridge execution.
  * *Where Used*: Foundation for all client components and pages.
* **`expo`**:
  * *Why Used*: Managed workflow suite for building, compiling, and accessing native device features.
  * *Where Used*: Root environment configurations, configuration wrappers, and plugins.
* **`expo-router`**:
  * *Why Used*: Handles file-based routing and navigation transitions.
  * *Where Used*: [src/app/_layout.tsx](file:///E:/Apps/NiroPay/src/app/_layout.tsx), [src/app/index.tsx](file:///E:/Apps/NiroPay/src/app/index.tsx) and all screens under `src/app/`.

### B. Hardware & Native Sensors APIs
* **`expo-local-authentication`**:
  * *Why Used*: Provides access to the device's hardware biometric sensors (Touch ID, Face ID, Android BiometricPrompt).
  * *Where Used*:
    * [src/app/login.tsx](file:///E:/Apps/NiroPay/src/app/login.tsx#L7) (Biometric login)
    * [src/app/register/index.tsx](file:///E:/Apps/NiroPay/src/app/register/index.tsx#L5) (Biometric signup)
    * [src/app/send/send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx#L6) (Biometric transaction authorization)
* **`expo-camera`**:
  * *Why Used*: Captures front camera frames for facial verification and back camera frames for QR code scanning.
  * *Where Used*:
    * [src/app/scan/index.tsx](file:///E:/Apps/NiroPay/src/app/scan/index.tsx) (QR Scanner viewfinder)
    * [src/app/send/send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx#L8) (Face Capture modal camera)
* **`expo-device`**:
  * *Why Used*: Captures native device metadata (manufacturer, model, build ID) to compute the unique MAC address representation.
  * *Where Used*:
    * [src/services/api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L2) (Device ID string generation)
* **`expo-secure-store`**:
  * *Why Used*: Encrypts and securely stores sensitive variables (such as credentials, session tokens, and registered face templates) in the device's hardware keychain.
  * *Where Used*:
    * [src/app/login.tsx](file:///E:/Apps/NiroPay/src/app/login.tsx)
    * [src/app/register/index.tsx](file:///E:/Apps/NiroPay/src/app/register/index.tsx)
    * [src/app/send/send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx#L7)
* **`expo-contacts`**:
  * *Why Used*: Accesses the device's native address book contacts.
  * *Where Used*:
    * [src/app/send/index.tsx](file:///E:/Apps/NiroPay/src/app/send/index.tsx)
    * [src/app/recharge/index.tsx](file:///E:/Apps/NiroPay/src/app/recharge/index.tsx)

### C. Libraries & Utilities
* **`crypto-js`**:
  * *Why Used*: Client-side cryptographic helper library. Implements SHA-256 hashing, AES-256 symmetric encryption/decryption, and HMAC-SHA256 signatures.
  * *Where Used*:
    * [src/services/api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L3) (Envelope encryption, Layer 2 packet calculations)
    * [src/app/register/index.tsx](file:///E:/Apps/NiroPay/src/app/register/index.tsx)
* **`react-native-reanimated`**:
  * *Why Used*: Handles high-performance native-threaded UI transitions.
  * *Where Used*:
    * [src/components/animated-icon.tsx](file:///E:/Apps/NiroPay/src/components/animated-icon.tsx) (Splash overlay animations)
* **`react-native-safe-area-context`**:
  * *Why Used*: Ensures layouts adjust correctly for devices with screen notches and status bars.
  * *Where Used*: Roots layouts and custom header components.

---

## 2. Backend Dependencies (`requirements.txt`)

### A. Web API Server
* **`fastapi`**:
  * *Why Used*: Modern, high-performance web framework for building APIs.
  * *Where Used*: Main routing, request parsing, and validation core inside [app.py](file:///E:/Apps/NiroPay/backend/app.py).
* **`uvicorn`**:
  * *Why Used*: An ASGI web server implementation used to run FastAPI.
  * *Where Used*: Root launcher uvicorn configurations.
* **`gunicorn`**:
  * *Why Used*: WSGI/ASGI process manager used for production web deployments.
  * *Where Used*: Heroku/Render launch script `Procfile`.

### B. Security & Cryptography
* **`pycryptodome`**:
  * *Why Used*: Provides cryptographic helper algorithms (AES-256-CBC, PKCS7 padding modules).
  * *Where Used*:
    * [backend/crypto.py](file:///E:/Apps/NiroPay/backend/crypto.py) (Low-level encryption and decryption engine).

### C. Database Drivers & SDKs
* **`supabase`**:
  * *Why Used*: Official SDK for interacting with Supabase cloud databases.
  * *Where Used*:
    * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L16) (Executes profile lookups, auth session creation, and RPC transactions).
* **`psycopg2-binary`**:
  * *Why Used*: PostgreSQL database adapter for Python. Used to execute direct database queries and transactional raw queries.
  * *Where Used*:
    * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L11) (Initializes database tables, manages search queries, and locks transaction rows).

### D. System Utilities
* **`python-dotenv`**:
  * *Why Used*: Loads environment variables from a `.env` file into the application context.
  * *Where Used*:
    * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L8) (Loads configurations from `backend/.env.backend`).
