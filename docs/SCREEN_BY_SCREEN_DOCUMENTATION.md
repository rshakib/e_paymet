# SCREEN_BY_SCREEN_DOCUMENTATION.md

---

## 1. Login Screen
* **File Path**: `src/app/login.tsx`
* **Route**: `/login` (Loaded conditionally by index route if `globalSession.isLoggedIn` is false)
* **Purpose**: Authenticate registered users using username/mobile and 4-to-6 digit PIN. Manages fallback hardware local biometrics login.
* **UI Components**: Secure logo emblem, floating label username/PIN text inputs, "Remember Me" checkbox, primary login action button, biometric scan trigger capsule, secondary registration redirect link.
* **State Variables**:
  * `username` (string): Active input content.
  * `pin` (string): User entered PIN.
  * `rememberMe` (boolean): Remember credentials state.
  * `isPending` (boolean): Set true during request processing to disable interactions.
  * `hasBiometricSetup` (boolean): True if biometrics are supported and keys exist.
* **Storage Variables**:
  * Reads/Writes `saved_username` and `saved_pin` via `SecureStore` if "Remember Me" is activated.
* **APIs Used**:
  * `authApiService.login(username, pin)` -> Calls `/auth/login` endpoint.
* **Database Data Displayed**: None.
* **Buttons**:
  * **Login Button**: Triggers `handleLogin()`.
  * **Fingerprint Icon**: Triggers `handleBiometricLogin()`.
  * **Register Link**: Triggers `router.push('/register')`.
* **Navigation Flow**:
  * On Login Success: Redirects internally to `/` which renders the Dashboard.
  * On Register Click: Navigates to `/register`.

---

## 2. Registration Screen
* **File Path**: `src/app/register/index.tsx`
* **Route**: `/register/index`
* **Purpose**: Registers new customer profiles, binds devices, and initializes cryptographic parameters.
* **UI Components**: Progress bar (NID Verify -> Activation -> Security Set), camera viewfinder overlay for NID capture, input forms, terms checkbox.
* **State Variables**:
  * `currentStep` (number): Tracks steps 1 to 3.
  * `fullName` (string), `nidNumber` (string), `dob` (string): User identity data.
  * `activationCode` (string), `mobileNumber` (string): Verification variables.
  * `pin` (string), `confirmPin` (string): PIN setup.
  * `enrolledBiometrics` (boolean): Setup option.
* **Storage Variables**:
  * Writes user profile details, NID, `k1`, `k2`, and `bp` values locally to `SecureStore` upon successful completion.
* **APIs Used**:
  * `authApiService.register(profile_details)` -> Calls `/auth/register` endpoint.
* **Database Data Displayed**: None.
* **Buttons**:
  * **Next / Verify NID Button**: Validates inputs, moves to Step 2.
  * **Submit Activation Button**: Verifies voucher code, moves to Step 3.
  * **Complete Registration Button**: Calls registration API.
* **Navigation Flow**:
  * On Success: Returns user to `/login` route.
  * Back button: Navigates back one step or exits to `/login`.

---

## 3. Dashboard Screen
* **File Path**: `src/screens/dashboard/DashboardScreen.tsx`
* **Route**: `/` (Default layout child)
* **Purpose**: Primary workspace. Shows current balances, transaction history shortcuts, quick payment actions, and system services.
* **UI Components**: Header user greeting card, balance capsule card with show/hide toggle, Quick Actions grid, "My NiroPay" horizontal carousel, "Recent Activity" vertical list, custom bottom navigation bar.
* **State Variables**:
  * `showBalance` (boolean): Obfuscates balance with `৳ ••••` when false, reveals amount when true. Default is false.
  * `balance` (number): Active user account balance.
  * `fullName` (string): Registered profile name.
  * `transactions` (array): List of transaction objects.
  * `loading` (boolean): Activity Indicator trigger.
* **Storage Variables**: None.
* **APIs Used**:
  * `authApiService.getUserProfile(username)` -> Calls `/user/{username}`.
  * `authApiService.getTransactions(username)` -> Calls `/transactions/{username}`.
* **Database Data Displayed**:
  * Account balances from `accounts.balance`.
  * Profile full name from `profiles.full_name`.
  * Transactions listing sender, receiver, amount, timestamp, and status.
* **Buttons**:
  * **Balance Card**: Toggles `showBalance` state.
  * **Action Items (Send Money, Recharge, Payment, Bill, Cash Out)**: Navigates to `/send`, `/recharge`, `/payment`, `/bill`, and `/cash-out` respectively.
  * **Bottom Nav Options**: Routing links to `/`, `/transactions`, `/services`, and `/profile`.
  * **Scan Button**: Routes directly to QR viewfinder page `/scan`.
* **Navigation Flow**:
  * Redirects to `/login` if authentication token expires (HTTP 401).

---

## 4. Send Money Screen (Flow Index)
* **File Path**: `src/app/send/index.tsx`
* **Route**: `/send/index`
* **Purpose**: Selects recipients for secure money transfers.
* **UI Components**: Back button header, floating search input, filter toggle chips (Favorites / Recent), list view displaying profile records matching search query.
* **State Variables**:
  * `search` (string): Real-time query.
  * `activeFilter` (string): 'favorites' or 'recent' active filters.
  * `contacts` (array): User contacts from matching address book.
  * `searchResults` (array): Matches returned from database search.
  * `loading` (boolean): Loader state.
* **Storage Variables**: None.
* **APIs Used**:
  * `authApiService.matchContacts(phones)` -> Calls `/contacts/match`.
  * `authApiService.searchUsers(query)` -> Calls `/search-users?q=...`.
  * `authApiService.checkReceiver(username)` -> Calls `/check-receiver/{username}`.
* **Database Data Displayed**:
  * Username and full name of registered users matching search.
* **Buttons**:
  * **Favorite / Recent Filter Cards**: Toggles filter state.
  * **Contact Item Card**: Selects user and navigates.
  * **Search Button**: Resolves receiver exists checks.
* **Navigation Flow**:
  * On valid contact click: Navigates to `/send/amount` passing `phone`, `name`, and `avatarColor` in query params.

---

## 5. Send Money Amount Screen
* **File Path**: `src/app/send/amount.tsx`
* **Route**: `/send/amount`
* **Purpose**: Inputs transfer amount.
* **UI Components**: Recipient identity summary card, central amount display with currency symbol `৳`, available balance indicator capsule, custom numeric keypad grid.
* **State Variables**:
  * `amount` (string): Numeric input accumulation.
  * `loading` (boolean): User profile validation indicator.
  * `userBalance` (number): Available wallet balance.
* **Storage Variables**: None.
* **APIs Used**:
  * `authApiService.getUserProfile(username)` -> Fetches active balance.
* **Database Data Displayed**:
  * Active balance from `accounts.balance`.
* **Buttons**:
  * **Numeric Keys (0-9, .)**: Appends character to `amount`.
  * **Backspace Key**: Deletes last character.
  * **Quick Value Chips (৳50, ৳100, ৳500, ৳1000)**: Sets amount value.
  * **Proceed Arrow Button**: Triggers validation checks.
* **Navigation Flow**:
  * Navigates to `/send/send-money-confirm` passing transaction details and amount. Shows an alert if amount > userBalance.

---

## 6. Send Money Confirm Screen
* **File Path**: `src/app/send/send-money-confirm.tsx`
* **Route**: `/send/send-money-confirm`
* **Purpose**: Securely executes money transfers using multi-factor local authentication.
* **UI Components**: Breakdown table (Amount, Fee, Total), reference note input field, biometric scanner emblem, modal overlay containing CameraView (front camera) for high-value face verification.
* **State Variables**:
  * `isAuthenticating` (boolean): Overlay loader.
  * `authStatus` (string): Text display indicating encryption or verification status.
  * `cameraModalVisible` (boolean): Toggles facial camera modal.
  * `cameraPermission` (boolean): Tracks camera access state.
* **Storage Variables**:
  * Reads local face template landmarks from `SecureStore` via key `face_landmarks_template` to match face.
* **APIs Used**:
  * `authApiService.transfer(receiver, amount, k1, k2, bp)` -> Layer 2 transaction POST.
* **Database Data Displayed**: None.
* **Buttons**:
  * **Biometric Sensor Capsule**: Calls `handleBiometricAuth()`.
  * **Camera Shutter Button**: Captures landmark arrays, verifies profile, and executes transaction.
* **Navigation Flow**:
  * On Success: Navigates to `/send/success` clearing inputs.
  * On Failure: Renders alert, remains on screen.

---

## 7. Send Money Success Screen
* **File Path**: `src/app/send/success.tsx`
* **Route**: `/send/success`
* **Purpose**: Renders the transaction completion receipt.
* **UI Components**: Success badge circle with checkmark, confetti animations, receipt container card showing dynamic transaction timestamp, recipient info, and Transaction ID.
* **State Variables**: None.
* **Storage Variables**: None.
* **APIs Used**: None.
* **Database Data Displayed**: None.
* **Buttons**:
  * **Back to Home Button**: Triggers `router.replace('/')`.
* **Navigation Flow**:
  * Forces routing back to root dashboard.

---

## 8. Mobile Recharge Flow Screen
* **File Path**: `src/app/recharge/index.tsx`, `amount.tsx`, `confirm.tsx`, `success.tsx`
* **Route**: `/recharge`, `/recharge/amount`, `/recharge/confirm`, `/recharge/success`
* **Purpose**: Allows mobile airtime refills.
* **State Variables**:
  * `selectedOperator` (object): Tracks active operator (GP, Robi, Airtel, Banglalink, Teletalk) derived from mobile prefix.
  * `amount` (string): Airtime refill amount (integers only).
* **APIs Used**:
  * `authApiService.getRechargeOperators()` -> Fetches carrier profiles.
  * `authApiService.recharge(phone, amount, operator)` -> Calls `/auth/recharge`.
* **Navigation Flow**:
  * Index contact selection -> Enter amount -> Confirm recharge -> Success page.

---

## 9. Merchant Payment Flow Screen
* **File Path**: `src/app/payment/index.tsx`, `amount.tsx`, `confirm.tsx`, `success.tsx`
* **Route**: `/payment`, `/payment/amount`, `/payment/confirm`, `/payment/success`
* **Purpose**: Processes merchant payments.
* **APIs Used**:
  * `authApiService.searchUsers(query)` -> Matches merchant registration.
  * `authApiService.merchantPayment(merchant, amount)` -> Calls `/auth/merchant-payment`.
* **Navigation Flow**:
  * Merchant select -> Enter amount -> Confirm credentials -> Success page.

---

## 10. QR Scanner Flow Screen
* **File Path**: `src/app/scan/index.tsx`, `result.tsx`, `confirm.tsx`, `success.tsx`
* **Route**: `/scan`, `/scan/result`, `/scan/confirm`, `/scan/success`
* **Purpose**: Scans code coordinates to process merchant or peer payments.
* **UI Components**: Viewfinder layout with custom borders, scan line indicator.
* **APIs Used**:
  * `authApiService.merchantPayment(merchant, amount)` -> Processes QR-derived merchant details.
* **Navigation Flow**:
  * Scanner viewfinder -> Scanned result amount entry -> Confirm details -> Success page.

---

## 11. Cash Out Flow Screen
* **File Path**: `src/app/cash-out/index.tsx`, `amount.tsx`, `confirm.tsx`, `token.tsx`
* **Route**: `/cash-out`, `/cash-out/amount`, `/cash-out/confirm`, `/cash-out/token`
* **Purpose**: Withdraws funds at physical bank counters or ATMs.
* **UI Components**: Checklist guidelines, multi-stage identity verifying sensor cards (PIN -> Fingerprint -> Face), 5-minute countdown clock, 6-digit monospace code block.
* **State Variables**:
  * `activeStage` (string): PIN, Fingerprint, Face ID, or Completed verification status.
  * `timeLeft` (number): Countdown seconds.
  * `tokenCode` (string): Generated 6-digit authentication token.
* **Navigation Flow**:
  * Instructions -> Perform multi-stage authentication -> Generate 6-digit code -> Transaction success dashboard.

---

## 12. Utility Bill Payment Screen
* **File Path**: `src/app/bill.tsx`
* **Route**: `/bill`
* **Purpose**: Displays and pays registered utility bills.
* **UI Components**: Back button, list of outstanding bills with due dates, pending loaders.
* **State Variables**:
  * `bills` (array): List of bill items.
  * `loading` (boolean): Activity Indicator state.
  * `payingBillId` (string): ID of bill item being paid.
* **APIs Used**:
  * `authApiService.getBills(username)` -> Fetches bills.
  * `authApiService.payBill(billId)` -> Processes payment.
* **Database Data Displayed**:
  * Biller name, account code, amount, and due date.
* **Navigation Flow**:
  * Returns to `/` when back button is pressed.
