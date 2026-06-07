# DEAD_CODE_AND_TECHNICAL_DEBT.md

---

## 1. Unused Files & Routes

### A. Route File: `src/app/send/auth.tsx`
* **Status**: Dead Code / Unused.
* **Reasoning**: In early development, this file served as the biometric authorization check for money transfers. The functionality has since been integrated directly into [send-money-confirm.tsx](file:///E:/Apps/NiroPay/src/app/send/send-money-confirm.tsx), which handles both biometrics and high-value face camera captures on a single confirmation page. This page is bypassed by the current user navigation flow.

### B. Route File: `src/app/explore.tsx`
* **Status**: Unused.
* **Reasoning**: A default template file generated during the initial Expo project creation. It has no functional connection to the NiroPay application.

---

## 2. Legacy / Redundant API Endpoints (`backend/app.py`)

The backend contains several legacy endpoints that were used prior to the implementation of the secure envelope (Layer 1) communication wrapper.

### A. Endpoint: `POST /login`
* **Status**: Redundant / Technical Debt.
* **Reasoning**: Superseded by `POST /auth/login`. The client now encrypts login payloads and sends them to the `/auth/login` endpoint, making the plaintext `/login` endpoint obsolete.

### B. Endpoint: `POST /register`
* **Status**: Redundant / Technical Debt.
* **Reasoning**: Superseded by `POST /auth/register` which processes encrypted envelopes. The plaintext `/register` endpoint remains in the code but is no longer called by the frontend.

### C. Endpoint: `POST /transfer`
* **Status**: Redundant / Technical Debt.
* **Reasoning**: Superseded by `POST /auth/transfer`. The client now sends encrypted transfer payloads to `/auth/transfer`, meaning `/transfer` is no longer used.

---

## 3. Mock Screens & Upcoming Features (Technical Debt)

Several screens in the application serve as placeholders for upcoming features. They display mock data and do not interface with the backend:

1. **Bank Transfer Screen** ([bank-transfer.tsx](file:///E:/Apps/NiroPay/src/app/bank-transfer.tsx)): Shows an "Upcoming Feature" status badge.
2. **My Cards Screen** ([my-cards.tsx](file:///E:/Apps/NiroPay/src/app/my-cards.tsx)): A static UI placeholder for linked cards.
3. **Savings Screen** ([savings.tsx](file:///E:/Apps/NiroPay/src/app/savings.tsx)): Shows static text detailing savings options.
4. **Buy Tickets Screen** ([tickets.tsx](file:///E:/Apps/NiroPay/src/app/tickets.tsx)): A placeholder screen for buying tickets.
5. **Services Screen** ([services.tsx](file:///E:/Apps/NiroPay/src/app/services.tsx)): A static list of available wallet options.
