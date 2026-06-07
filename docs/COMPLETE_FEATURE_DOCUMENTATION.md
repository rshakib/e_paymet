# COMPLETE_FEATURE_DOCUMENTATION.md

---

## 1. User Registration
* **User Experience & UI**: 3-step setup progress bar. Capture front and back images of the NID using the camera, verify the activation code, and set a password and PIN.
* **Cryptographic Generation**: Derives `K2` (PBKDF2 PIN stretching using the NID as salt) and `K1` (hardware-bound HMAC key derived from MAC address, activation code, and NID). Generates a fingerprint template hash `bp_hash`.
* **API Interactions**: Encapsulates payload in the Layer 1 secure envelope and sends it to `/auth/register`.
* **Database Updates**: Writes profile metadata and keys to `profiles`. Inserts a wallet record in `accounts` with a starting balance of ৳5,000.00.

---

## 2. User Login
* **User Experience & UI**: Prompts for username/mobile and PIN. Includes a "Remember Me" checkbox and a biometric fingerprint trigger.
* **Biometric Enrollment Check**: Checks if local credentials are saved in the device's hardware keychain (`SecureStore`).
* **API Interactions**: Sends credentials to `/auth/login`. On success, saves the access token in memory (`setAuthToken`) and session data in the global session context.

---

## 3. Dashboard
* **User Experience & UI**: Shows quick action icons, recent transactions, and account balance.
* **Balance Privacy Feature**: Obfuscates balance with `৳ ••••` by default. Tapping the card toggles visibility to reveal the balance.
* **API Interactions**: Calls `/user/{username}` to fetch balance and profile details, and `/transactions/{username}` to populate the transaction history list.

---

## 4. Send Money (P2P Transfer)
* **User Experience & UI**: Prompts user to select a contact, enter the amount, and confirm transaction details.
* **Biometric Verification**: Requires Fingerprint/Face ID authentication. Transactions > ৳5,000 trigger front camera face verification against the registered template.
* **API Interactions**: Sends a Layer 2 encrypted payload (Message `M` + HMAC `F1`) to `/auth/transfer`.
* **Database Updates**: Invokes the `process_transfer_secure` stored procedure. Debits sender account, credits receiver account, updates sender timestamp `last_t`, and logs transaction status.

---

## 5. Mobile Recharge
* **User Experience & UI**: Automatically detects the mobile operator (GP, Robi, Airtel, Banglalink, Teletalk) from the phone prefix. Prompts user to select Prepaid/Postpaid and enter the recharge amount (integers only).
* **API Interactions**: Calls `POST /auth/recharge` with phone, amount, and operator name.
* **Database Updates**: Debits the user's wallet in `accounts` and inserts a recharge log in `transactions`.

---

## 6. Utility Bill Payment
* **User Experience & UI**: Displays a list of outstanding bills (e.g. DESCO Electricity, Link3 Internet) with due dates and payment status.
* **API Interactions**: Calls `/bills/{username}` to list bills and `POST /bills/pay` to pay a bill.
* **Database Updates**: Locks the user account and bill record (`FOR UPDATE`). Debits the wallet balance, updates the bill status to `'paid'`, sets `paid_at = CURRENT_TIMESTAMP`, and logs the transaction.

---

## 7. Merchant Payment
* **User Experience & UI**: Prompts user to search for a merchant, enter the amount, input an optional reference note, and authenticate.
* **API Interactions**: Calls `/search-users` to query merchants and `POST /auth/merchant-payment` to execute payment.
* **Database Updates**: Debits customer account balance, credits merchant account balance, and inserts an audit log.

---

## 8. QR Payment
* **User Experience & UI**: Opens camera viewfinder to scan merchant QR code. Automatically extracts merchant details from the QR payload.
* **API Interactions**: Decodes the QR payload and calls `POST /auth/merchant-payment` to process payment.
* **Database Updates**: Debits customer account balance, credits merchant account balance, and inserts a transaction log.

---

## 9. Transaction History
* **User Experience & UI**: Displays user transactions grouped by date (e.g. Today, Yesterday) with filter chips (All, Cash In, Cash Out / Send, Bills & Topups).
* **API Interactions**: Calls `/transactions/{username}` to fetch transactions.
* **Database Updates**: None (read-only queries).

---

## 10. Contacts Matcher
* **User Experience & UI**: Matches the device's native address book contacts against registered users in the system database.
* **API Interactions**: Calls `POST /contacts/match` with a list of contact phone numbers.
* **Database Updates**: None (read-only queries).

---

## 11. Profile & Settings
* **User Experience & UI**: Shows user information (legal name, NID, DOB, registered device MAC address). Provides settings to toggle language (English/Bangla) and app theme.
* **API Interactions**: Calls `/user/{username}` to fetch profile details and `/auth/logout` on logout.
* **Database Updates**: Updates the database if changing display settings, or logs out session.
