# NiroPay Project

## Completed Steps

### Phase 1: Environment & Dashboard Setup
- [DONE] Step 1 — Environment Setup
- [DONE] Step 2 — Expo Project Initialized
- [DONE] Step 3 — Dashboard base screen connected
- [DONE] Step 4.1 — Dashboard header and balance card UI
- [DONE] Step 4.2 — Quick Actions UI completed
- [DONE] Step 4.3 — My NiroPay section UI completed
- [DONE] Step 4.4 — Recent Activity UI completed
- [DONE] Step 4.5 — Bottom Navigation UI with Scan button completed
- [DONE] Step 4.6 — Bottom Navigation pixel-perfect UI matched

### Phase 2: Send Money Flow (Reference Design)
- [DONE] Step 5.1 — Send Money screen UI created under `src/app/send/`
- [DONE] Step 5.2 — Upgraded Send Money to premium royal navy design theme (`#0A1F44`)
- [DONE] Step 5.3 — Floating Search Bar overlapping header with smooth padding/margins
- [DONE] Step 5.4 — Contact selection list structured with Favorites, Recent, and All Contacts sections
- [DONE] Step 5.5 — Amount Input screen with centered big Taka `৳` display, available balance capsule (`৳ 24,560.50`), and custom retro numeric keypad
- [DONE] Step 5.6 — Passed real transfer amount dynamically to next screen
- [DONE] Step 5.7 — Confirm Payment screen with receipt breakdown sheet, secure emblem, passcode dot animations, and mock biometric scan loader
- [DONE] Step 5.8 — Confetti Success Receipt canvas with white check circle, static transaction ID, and home button redirects
- [DONE] Step 5.9 — Routed the whole flow inside `src/app/send/` via Expo Router with `headerShown: false`

### Phase 3: Dashboard & Search Bar Fixes
- [DONE] Step 5.10 — Fixed index page search bar overlapping issues and aligned header color with the royal navy dashboard style
- [DONE] Step 5.11 — Integrated `qr.png` asset as the primary scanner icon in all QR code options (including header, shortcut cards, and dashboard scan button)

### Phase 4: Mobile Recharge Flow
- [DONE] Step 6.1 — Initialized a pixel-perfect Mobile Recharge flow under `src/app/recharge/` modeled after `send.png`
- [DONE] Step 6.2 — Screen 1 (`recharge/index.tsx`): Top-up contact search with numeric prefix auto-detection (e.g. `017` for Grameenphone, `018` for Robi, etc.) and Favorites/Recent listings
- [DONE] Step 6.3 — Screen 2 (`recharge/amount.tsx`): Recipient card displaying active operator color, Prepaid/Postpaid selector, preset amount chips, available balance capsule (`৳ 24,560.50`), and custom keypad
- [DONE] Step 6.4 — Screen 3 (`recharge/confirm.tsx`): Breakdown receipt with cost, total, charge (`৳ 0.00`) separated by a dotted horizontal line, passcode sequence dots, and mock biometric scanner
- [DONE] Step 6.5 — Screen 4 (`recharge/success.tsx`): Confetti background, white check circle, monospace receipt card, and home redirect triggers
- [DONE] Step 6.6 — Simplified UX for Mobile Recharge by completely removing manual operator selection grid and QR scan components per user specification
- [DONE] Step 6.6 FIX — Fixed React Navigation screen collision by removing duplicate root recharge.tsx
- [DONE] Step 6.7 FIX — Simplified Recharge UX by removing manual operator selection and header/shortcut QR scanner dependencies
- [DONE] Step 6.8 FIX — Resolved nested touchable events in both Send Money & Mobile Recharge contact cards to make them fully clickable
- [DONE] Step 6.9 FIX — Implemented interactive Favorites/Recent filter toggles with highlight active card styles in Send Money & Mobile Recharge index screens
- [DONE] Step 6.10 FIX — Upgraded Mobile Recharge keypad to integer-only layout, replacing decimal key with a blank View spacer and forcing integer validations
- [DONE] Step 6.11 — Implemented interactive show/hide balance privacy toggle on the main dashboard screen
- [DONE] Step 6.12 QA — Complete app codebase verified and passing ESLint quality checks with zero warnings and zero errors

### Phase 5: Merchant Payment Flow (payment.png)
- [DONE] Step 7.1 — Initialized a pixel-perfect Merchant Payment flow under `src/app/payment/` modeled after `payment.png`
- [DONE] Step 7.2 — Screen 1 (`payment/index.tsx`): Merchant search bar, Scan QR Code button, Recent listing (Nadir Optics, Royal Bakery, Unimart), and Saved Payments (Tikhfa reference)
- [DONE] Step 7.3 — Screen 2 (`payment/amount.tsx`): Selected merchant pill, enter amount with cursor indicator, available balance pill (`৳ 24,560.50`), and custom keypad with decimal support
- [DONE] Step 7.4 — Screen 3 (`payment/confirm.tsx`): Breakdown receipt separated by dotted lines, Reference note input, premium interactive Biometric scanning sensor (Touch ID / Face ID) with pulsing borders, mock identity verification loaders, and a direct Confirm & Pay action button
- [DONE] Step 7.5 — Screen 4 (`payment/success.tsx`): Confetti navy background with colorful squares/diamonds, white success tick circle, receipt card showing monospace Transaction ID (`NPR1234567890`), dynamic date/time formatting, and home/payment redirect actions
- [DONE] Step 7.6 — Complete navigation cleanup: Deleted obsolete duplicate bridge files (`src/app/payment.tsx`, `src/app/send-money.tsx`, `src/app/send-money-confirm.tsx`, `src/app/amount.tsx`, `src/app/auth.tsx`, `src/app/success.tsx`) and removed all header bird logo assets to keep layouts clean and focused
- [DONE] Step 7.7 QA — Ran strict project diagnostics and confirmed 100% clean builds with zero ESLint errors and warnings

### Phase 6: QR Scanner Flow (scan.png)
- [DONE] Step 8.1 — Initialized a pixel-perfect QR Scanner flow under `src/app/scan/` modeled after `scan.png`
- [DONE] Step 8.2 — Screen 1 (`scan/index.tsx`): Custom header, Scan/My QR tabs, viewfinder window overlay with four glowing corners and neon pulsing scan line, flash/gallery actions, guidelines checkcard, and full home navigation bar mapping
- [DONE] Step 8.3 — Screen 2 (`scan/result.tsx`): Storefront icon avatar, merchant details with verified badge, Enter Amount displays with blinking cursor representation, Available Balance pill (`৳ 24,560.50`), and custom keypad with decimal support
- [DONE] Step 8.4 — Screen 3 (`scan/confirm.tsx`): Monospace receipts with charges and reference notes, standard-blue pulsing biometric sensor Touch ID / Face ID scanner pulser card, and solid Confirm & Pay button
- [DONE] Step 8.5 — Screen 4 (`scan/success.tsx`): Navy successfully completed screen with rotating confetti diamond particles, white success tick circle, receipt details with Transaction ID (`NPR1234567890`), and home/scan redirects
- [DONE] Step 8.6 — Navigation cleanup: Deleted legacy scan placeholder files (`src/app/scan.tsx`) to resolve routing conflicts
- [DONE] Step 8.7 QA — Executed final project diagnostics, passing cleanly with zero ESLint errors and warnings across the entire project

### Phase 7: Backend Auth System
- [DONE] Step 9.1 — Re-initialized FastAPI backend structure for Cloud DB
- [DONE] Step 9.2 — Configured dependencies and database connection for Supabase
- [DONE] Step 9.3 — Implemented User models with NID, Mobile, and MAC address support
- [DONE] Step 9.4 — Created security module with AES-256, HMAC, and Bcrypt hashing
- [DONE] Step 9.5 — Implemented Register, Login, and Logout API endpoints with device binding

### Phase 8: Frontend Security & Biometric Integration
- [DONE] Step 10.1 — Installed and configured `expo-local-authentication` for real hardware sensor access
- [DONE] Step 10.2 — Implemented AES-256 + HMAC-SHA256 secure communication layer in `apiClient`
- [DONE] Step 10.3 — Integrated real biometric enrollment in Registration screen
- [DONE] Step 10.4 — Integrated real biometric login with hardware verification
- [DONE] Step 10.5 — Updated Transaction Auth screens to use real biometric confirmation

---

## Current Status

- **Send Money Flow**: Fully completed, high-fidelity premium design, operating seamlessly under `/send`.
- **Mobile Recharge Flow**: Fully completed, operator-branded theme colors, simplified UX, operating seamlessly under `/recharge`.
- **Merchant Payment Flow**: Fully completed, high-fidelity premium design, operating seamlessly under `/payment`.
- **QR Scanner Flow**: Fully completed, high-fidelity premium design, operating seamlessly under `/scan`.
- **Linter Health**: Clean code, zero warnings, and zero errors via strict ESLint checks.

---

## Next Steps

- **Step 9.1** — Implement remaining transaction flows (Pay Bill / Cash Out) matching the high-fidelity corporate blue design theme.
- **Step 9.2** — Hook up network API managers to query real balance totals and transaction logs.
