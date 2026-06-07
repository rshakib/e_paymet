# COMPLETE_FOLDER_TREE.md

## 1. Project Directory Structure

```
NiroPay/
├── .antigravitycli/
├── .claude/
├── .env
├── .expo/
├── .git/
├── .gitignore
├── .vscode/
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
├── New folder/
├── README.md
├── android/
├── app.json
├── assets/
│   └── qr.png
├── backend/
│   ├── .env.backend
│   ├── Procfile
│   ├── app.py
│   ├── crypto.py
│   ├── render.yaml
│   ├── requirements.txt
│   └── supabase_config.py
├── done.txt
├── eas.json
├── eslint.config.js
├── expo-env.d.ts
├── master.md
├── package-lock.json
├── package.json
├── scripts/
│   └── reset-project.js
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── bank-transfer.tsx
│   │   ├── bill.tsx
│   │   ├── cash-out/
│   │   │   ├── amount.tsx
│   │   │   ├── confirm.tsx
│   │   │   ├── index.tsx
│   │   │   └── token.tsx
│   │   ├── explore.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── my-cards.tsx
│   │   ├── payment/
│   │   │   ├── amount.tsx
│   │   │   ├── confirm.tsx
│   │   │   ├── index.tsx
│   │   │   └── success.tsx
│   │   ├── profile.tsx
│   │   ├── recharge/
│   │   │   ├── amount.tsx
│   │   │   ├── confirm.tsx
│   │   │   ├── index.tsx
│   │   │   └── success.tsx
│   │   ├── register/
│   │   │   └── index.tsx
│   │   ├── savings.tsx
│   │   ├── scan/
│   │   │   ├── confirm.tsx
│   │   │   ├── index.tsx
│   │   │   ├── result.tsx
│   │   │   └── success.tsx
│   │   ├── send/
│   │   │   ├── amount.tsx
│   │   │   ├── auth.tsx
│   │   │   ├── index.tsx
│   │   │   ├── send-money-confirm.tsx
│   │   │   └── success.tsx
│   │   ├── services.tsx
│   │   ├── tickets.tsx
│   │   └── transactions.tsx
│   ├── components/
│   │   ├── animated-icon.module.css
│   │   ├── animated-icon.tsx
│   │   ├── animated-icon.web.tsx
│   │   ├── app-tabs.tsx
│   │   ├── app-tabs.web.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── external-link.tsx
│   │   ├── hint-row.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   ├── ui/
│   │   │   └── collapsible.tsx
│   │   └── web-badge.tsx
│   ├── constants/
│   │   ├── auth.ts
│   │   └── theme.ts
│   ├── global.css
│   ├── hooks/
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme.ts
│   ├── screens/
│   │   └── dashboard/
│   │       └── DashboardScreen.tsx
│   └── services/
│       └── api.ts
└── tsconfig.json
```

---

## 2. File Directory & Architectural Purpose

### A. Frontend Roots & Configurations
* **[package.json](file:///E:/Apps/NiroPay/package.json)**:
  * *Purpose*: Manages project dependencies, engines, scripts (such as `npm run start`, `npm run android`, `npm run lint`), and project meta configuration.
  * *Dependencies*: Includes `expo`, `react`, `react-native`, `expo-router`, `crypto-js`, `expo-local-authentication`, `expo-camera`, and `react-native-reanimated`.
* **[app.json](file:///E:/Apps/NiroPay/app.json)**:
  * *Purpose*: Configures Expo build settings, app icons, splash screens, permissions (camera, biometrics), scheme, and bundle identifiers for iOS and Android.
* **[tsconfig.json](file:///E:/Apps/NiroPay/tsconfig.json)**:
  * *Purpose*: Defines TypeScript compiler parameters and path aliases (e.g. `@/*` mapping to `./src/*`).

### B. App Navigation & Routes (`src/app/`)
* **[_layout.tsx](file:///E:/Apps/NiroPay/src/app/_layout.tsx)**:
  * *Purpose*: Configures global navigation context, stacks, and safe areas.
  * *Imports*: `Stack`, `ThemeProvider` from `expo-router`, `AnimatedSplashOverlay` from `@/components/animated-icon`.
  * *Exports*: `RootLayout` (Default React Component).
* **[index.tsx](file:///E:/Apps/NiroPay/src/app/index.tsx)**:
  * *Purpose*: Volatile route decider.
  * *Imports*: `DashboardScreen` from `../screens/dashboard/DashboardScreen`, `LoginScreen` from `./login`, `globalSession` from `../constants/auth`.
  * *Exports*: `Index` (Default React Component).
* **[login.tsx](file:///E:/Apps/NiroPay/src/app/login.tsx)**:
  * *Purpose*: Renders user login interface and handles biometric authentication enrollment checks.
  * *Imports*: `authApiService` from `../services/api`, `globalSession` from `../constants/auth`, `LocalAuthentication` from `expo-local-authentication`, `SecureStore` from `expo-secure-store`.
  * *Exports*: `LoginScreen` (Default React Component).
* **[register/index.tsx](file:///E:/Apps/NiroPay/src/app/register/index.tsx)**:
  * *Purpose*: Multi-stage registration screen. Captures NID, MAC address, creates device keys, and performs signups.
  * *Imports*: `authApiService` from `../../services/api`, `LocalAuthentication` from `expo-local-authentication`, `SecureStore` from `expo-secure-store`, `CryptoJS` from `crypto-js`.
  * *Exports*: `RegisterScreen` (Default React Component).
* **[profile.tsx](file:///E:/Apps/NiroPay/src/app/profile.tsx)**:
  * *Purpose*: Manage preferences, toggle language (English/Bangla), display NID, registration properties, and handle session logout.
  * *Imports*: `authApiService` from `../services/api`, `globalSession` from `../constants/auth`.
  * *Exports*: `ProfileScreen` (Default React Component).

### C. Flow Subdirectories (`src/app/`)
* **`src/app/send/`**:
  * *[index.tsx](file:///E:/Apps/NiroPay/src/app/send/index.tsx)*: Contacts/receiver selection. Filters favorites and matches address books. Calls `checkReceiver` and `matchContacts`.
  * *[amount.tsx](file:///E:/Apps/NiroPay/src/app/send/amount.tsx)*: Recipient display and numeric keypad.
  * *[send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx)*: Confirms transfer, handles Local Authentication, and opens the Camera for facial landmark scanning for amounts > ৳5,000. Calls `authApiService.transfer`.
  * *[success.tsx](file:///E:/Apps/NiroPay/src/app/send/success.tsx)*: Renders receipt matching `send.png` design template.
* **`src/app/recharge/`**:
  * *[index.tsx](file:///E:/Apps/NiroPay/src/app/recharge/index.tsx)*: Carrier prefix auto-detection contact selector.
  * *[amount.tsx](file:///E:/Apps/NiroPay/src/app/recharge/amount.tsx)*: Numeric keypad for integer-only airtime refills.
  * *[confirm.tsx](file:///E:/Apps/NiroPay/src/app/recharge/confirm.tsx)*: Monospace breakdown with carrier branding. Calls `authApiService.recharge`.
  * *[success.tsx](file:///E:/Apps/NiroPay/src/app/recharge/success.tsx)*: Airtime refill receipt.
* **`src/app/payment/`** and **`src/app/scan/`**:
  * *Purpose*: Merchant payment flows. Scans QR codes, allows reference note inputs, and processes transactions using biometrics. Call `authApiService.merchantPayment`.
* **`src/app/cash-out/`**:
  * *Purpose*: ATM/branch cash withdrawals. Verifies PIN, fingerprints, and face structures, then generates a temporary 6-digit verification code.
* **[bill.tsx](file:///E:/Apps/NiroPay/src/app/bill.tsx)**:
  * *Purpose*: Utility bills display and payment execution. Calls `getBills` and `payBill`.
* **[transactions.tsx](file:///E:/Apps/NiroPay/src/app/transactions.tsx)**:
  * *Purpose*: Groups, filters (all, in, out, bills), and renders the user's transaction history. Calls `getTransactions`.

### D. UI Components & Constants (`src/components/`, `src/constants/`)
* **[components/bottom-nav.tsx](file:///E:/Apps/NiroPay/src/components/bottom-nav.tsx)**:
  * *Purpose*: Pixel-perfect bottom bar rendering with navigation options and a floating scan button.
* **[constants/auth.ts](file:///E:/Apps/NiroPay/src/constants/auth.ts)**:
  * *Purpose*: Exposes a singleton `globalSession` keeping volatile storage of registered credentials (`k1`, `k2`, `bp`, `last_t`, `username`, `balance`, `accountId`).
* **[constants/theme.ts](file:///E:/Apps/NiroPay/src/constants/theme.ts)**:
  * *Purpose*: Dictates the corporate dark blue branding styles.
* **[services/api.ts](file:///E:/Apps/NiroPay/src/services/api.ts)**:
  * *Purpose*: Implements the cryptographic core. Builds `security.encryptTransaction` (Layer 2) and `apiClient.postSecure` (Layer 1).

### E. Python Backend System (`backend/`)
* **[backend/app.py](file:///E:/Apps/NiroPay/backend/app.py)**:
  * *Purpose*: Exposes FastAPI endpoints. Verifies database limits, manages replay protection checks, parses envelopes, and interfaces with Supabase.
* **[backend/crypto.py](file:///E:/Apps/NiroPay/backend/crypto.py)**:
  * *Purpose*: Provides low-level PyCryptodome methods for AES-256-CBC envelope encapsulation, PBKDF2 hashing, and HMAC validations.
* **[backend/supabase_config.py](file:///E:/Apps/NiroPay/backend/supabase_config.py)**:
  * *Purpose*: Holds Supabase credentials and initializes DB details.
