# COMPLETE_BUTTON_MAPPING.md

---

## 1. Authentication & Setup Buttons

### A. Login Button
* **Button Text**: "Login"
* **Screen**: Login Screen (`src/app/login.tsx`)
* **Component**: `<TouchableOpacity style={styles.loginBtn}>`
* **onPress handler**: `onPress={handleLogin}`
* **Function called**: `handleLogin()`
* **API called**: `authApiService.login(username, pin)`
* **Backend route**: `POST /auth/login`
* **Database tables affected**:
  * Reads `profiles` (authenticates stretched PIN `password_key_k2`).
  * Updates `profiles` (sets stretched password on fallback legacy migration).
  * Reads `accounts` (fetches balance).
* **Success flow**: Sets authorization token via `setAuthToken(access_token)`, updates `globalSession.registeredUser` with user details (username, balance, keys, limits), sets `globalSession.isLoggedIn = true`, and navigates to the dashboard `/`.
* **Failure flow**: Clears input password field, displays error alert (e.g. "Invalid password" or "User not found"), and reenables input text fields.

### B. Biometric Login Trigger
* **Button Text**: Fingerprint Icon (Emoji 🫵 / 👤)
* **Screen**: Login Screen (`src/app/login.tsx`)
* **Component**: `<TouchableOpacity style={styles.biometricBtn}>`
* **onPress handler**: `onPress={handleBiometricLogin}`
* **Function called**: `handleBiometricLogin()`
* **API called**: `authApiService.login(storedUsername, storedPin)`
* **Backend route**: `POST /auth/login`
* **Database tables affected**: Reads `profiles` and `accounts`.
* **Success flow**: Local hardware verification succeeds. Fetches credentials from `SecureStore`, performs API login, updates global session, and navigates to dashboard `/`.
* **Failure flow**: Triggers hardware vibration and prompts user to authenticate using their PIN.

### C. Step 1: NID Next Button
* **Button Text**: "Verify NID & Next"
* **Screen**: Registration Step 1 (`src/app/register/index.tsx`)
* **Component**: `<TouchableOpacity style={styles.submitBtn}>`
* **onPress handler**: `onPress={handleStep1Next}`
* **Function called**: `handleStep1Next()`
* **API called**: None.
* **Backend route**: None.
* **Database tables affected**: None.
* **Success flow**: Validates that fields (Full Name, NID Number, DOB) are filled and NID is 10/17 digits. Toggles step state to Step 2.
* **Failure flow**: Highlights incorrect inputs and shows validation alert.

### D. Step 3: Complete Signup Button
* **Button Text**: "Complete Registration"
* **Screen**: Registration Step 3 (`src/app/register/index.tsx`)
* **Component**: `<TouchableOpacity style={styles.submitBtn}>`
* **onPress handler**: `onPress={handleCompleteRegistration}`
* **Function called**: `handleCompleteRegistration()`
* **API called**: `authApiService.register(details)`
* **Backend route**: `POST /auth/register`
* **Database tables affected**:
  * Inserts record into `profiles`.
  * Inserts record into `accounts` (creates account linked to profile, sets balance to ৳5,000).
* **Success flow**: Displays success alert, saves NID and biometrics preferences locally, and routes to `/login`.
* **Failure flow**: Re-enables form fields, shows database error code or username validation alert.

---

## 2. Dashboard Buttons

### A. Balance Hide/Show Toggle Card
* **Button Text**: "Current Balance" (capsule card wrapper)
* **Screen**: Dashboard Screen (`src/screens/dashboard/DashboardScreen.tsx`)
* **Component**: `<TouchableOpacity style={styles.balanceCard}>`
* **onPress handler**: `onPress={() => setShowBalance(prev => !prev)}`
* **Function called**: Inline state setter.
* **API called**: None.
* **Backend route**: None.
* **Database tables affected**: None.
* **Success flow**: Toggles visibility of balance (switches text between `৳ ••••` and `৳ balance`).
* **Failure flow**: None.

### B. Action Grid (Send Money, Recharge, Payment, Bill, Cash Out)
* **Button Text**: Individual action titles.
* **Screen**: Dashboard Screen (`src/screens/dashboard/DashboardScreen.tsx`)
* **Component**: `<TouchableOpacity style={styles.item}>`
* **onPress handler**: `onPress={() => router.push('/send')}` (and other flow routes)
* **Function called**: Expo router navigator.
* **API called**: None.
* **Backend route**: None.
* **Database tables affected**: None.
* **Success flow**: Navigates to `/send`, `/recharge`, `/payment`, `/bill`, or `/cash-out`.
* **Failure flow**: None.

### C. Floating QR Scan Button
* **Button Text**: "Scan" (with qr.png image icon)
* **Screen**: Dashboard Screen (`src/screens/dashboard/DashboardScreen.tsx`)
* **Component**: `<TouchableOpacity style={styles.scanWrap}>`
* **onPress handler**: `onPress={() => router.push('/scan')}`
* **Function called**: Expo router navigator.
* **API called**: None.
* **Backend route**: None.
* **Database tables affected**: None.
* **Success flow**: Opens Camera Viewfinder Screen at `/scan`.
* **Failure flow**: None.

---

## 3. Money Transfer Flow Buttons

### A. Select Contact Card
* **Button Text**: Contact list card representing names/numbers.
* **Screen**: Send Money Index Screen (`src/app/send/index.tsx`)
* **Component**: `<TouchableOpacity style={styles.contactCard}>`
* **onPress handler**: `onPress={() => handleSelectContact(item)}`
* **Function called**: `handleSelectContact(item)`
* **API called**: `authApiService.checkReceiver(item.username)`
* **Backend route**: `GET /check-receiver/{username}`
* **Database tables affected**: Reads `profiles` to check if receiver exists.
* **Success flow**: Navigates to `/send/amount` passing receiver parameters.
* **Failure flow**: Displays warning toast ("Recipient not registered").

### B. Keypad Proceed Button
* **Button Text**: Arrow Icon (→)
* **Screen**: Amount Selection (`src/app/send/amount.tsx` / `recharge/amount.tsx`)
* **Component**: `<TouchableOpacity style={styles.keypadProceedBtn}>`
* **onPress handler**: `onPress={handleProceed}`
* **Function called**: `handleProceed()`
* **API called**: None.
* **Backend route**: None.
* **Database tables affected**: None.
* **Success flow**: Checks that input amount > 0 and <= userBalance. Routes to confirmation screen (e.g. `/send/send-money-confirm`).
* **Failure flow**: Shows error alert ("Insufficient funds" or "Invalid amount").

### C. Confirm Biometric Scan Button
* **Button Text**: Biometric Scan Sensor (Touch ID / Face ID icon)
* **Screen**: Confirm Payment Screen (`src/app/send/send-money-confirm.tsx` / `payment/confirm.tsx`)
* **Component**: `<TouchableOpacity style={styles.sensorBtn}>`
* **onPress handler**: `onPress={handleBiometricAuth}`
* **Function called**: `handleBiometricAuth()`
* **API called**:
  * Under ৳5,000: Calls `authApiService.transfer` directly.
  * Over ৳5,000: Requests camera permission and opens Face Capture verification modal.
* **Backend route**: `POST /auth/transfer` (or `/auth/merchant-payment`)
* **Database tables affected**:
  * Updates `accounts` (debits sender, credits receiver).
  * Updates `profiles` (saves timestamp, increments daily spent).
  * Inserts record into `transactions`.
* **Success flow**:
  * Under ৳5,000: Executes transfer and navigates to Success screen.
  * Over ৳5,000: Opens face camera verification modal.
* **Failure flow**: Shows error message ("Authentication failed" or transaction abort code).

### D. Face Capture Camera Shutter Button
* **Button Text**: Shutter Circle (White outer circle with inner white dot)
* **Screen**: Face Verification Camera Modal (`src/app/send/send-money-confirm.tsx`)
* **Component**: `<TouchableOpacity style={styles.shutterBtn}>`
* **onPress handler**: `onPress={handleCaptureFace}`
* **Function called**: `handleCaptureFace()`
* **API called**: `authApiService.transfer`
* **Backend route**: `POST /auth/transfer`
* **Database tables affected**: Updates `accounts`, `profiles`, and inserts transaction log.
* **Success flow**: Capture successful. Simulates facial landmarks comparison against `SecureStore`. On match, closes modal, executes transfer, and routes to success screen `/send/success`.
* **Failure flow**: Closes camera modal, shows error message, and voids transaction processing.

---

## 4. Utility Bill Buttons

### A. Pay Bill Item Button
* **Button Text**: "Pay Bill"
* **Screen**: Bill List Screen (`src/app/bill.tsx`)
* **Component**: `<TouchableOpacity style={styles.payBtn}>`
* **onPress handler**: `onPress={() => handlePayBill(item.id)}`
* **Function called**: `handlePayBill(billId)`
* **API called**: `authApiService.payBill(billId)`
* **Backend route**: `POST /bills/pay`
* **Database tables affected**:
  * Updates `accounts` (debits user balance).
  * Updates `bills` (sets status = 'paid', paid_at = CURRENT_TIMESTAMP).
  * Inserts transaction log into `transactions`.
* **Success flow**: Changes button text to "Payment Successful!", plays brief delay, updates bill list in local view, and updates dashboard balance.
* **Failure flow**: Restores pay button state, displays Toast warning ("Insufficient balance" or server connection failure code).
