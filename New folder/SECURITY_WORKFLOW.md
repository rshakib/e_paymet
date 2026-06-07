# Cryptographic Security Workflow

This document outlines the three-phase security protocol implemented in the E-Banking system, defining registration, encryption, transaction signing, and verification steps.

---

## 🔑 Phase 1: Registration (Done once at the bank)

### Step R1: User Provides Identity to Bank Officer
*   **Inputs:**
    *   Sender = $A$
    *   NID = `19XX-XXXX-XXXX-XXXX`
    *   Activation Code (from bank officer) = `ACT-9981`
    *   MAC Address = `AA:BB:CC:DD:EE:FF`
    *   Biometric = Fingerprint (BP)
    *   Password (K2) = User-chosen, only known by user

### Step R2: Fingerprint Converted to Secure Hash
*   **Operation:**
    $$\text{BP\_hash} = \text{SHA-256}(\text{Fingerprint})$$
    $$\text{BP\_hash} = \text{9f86d081884c7d659a2feaa0c55ad015a3bf4f1...}$$
*   **Explanation:** Raw biometric data is never stored. A one-way hash is taken so the original fingerprint cannot be exposed or reused. This also solves the non-revocability problem of biometric data.

### Step R3: Generate K1 — HMAC Key
*   **Operation:**
    $$K1 = \text{HMAC-SHA256}(\text{Activation\_Code} \parallel \text{NID}, \text{MAC\_Address} \parallel \text{BP\_hash})$$
    $$K1 = \text{HMAC-SHA256}(\text{'ACT-998119XX-XXXX-XXXX-XXXX'}, \text{'AA:BB:CC:DD:EE:FF9f86d081...'})$$
    $$K1 = \text{K1\_c7f3a9b82d14e056...}$$
*   **Storage:** $K1$ is stored securely on the bank server, linked to the user's account.

### Step R4: Stretch Password K2 Using PBKDF2
*   **Operation:**
    $$K2\_stretched = \text{PBKDF2}(K2\_password, \text{NID\_as\_salt}, \text{iterations}=100000)$$
    $$K2\_stretched = \text{PBKDF2}(\text{'userpass'}, \text{'19XX-XXXX'}, 100000)$$
    $$K2\_stretched = \text{5e884898da28047151d0e56f8dc62927... (256-bit)}$$
*   **Storage:** $K2\_stretched$ is stored at the server. The raw password is **NEVER** stored.
*   **Explanation:** PBKDF2 with 100,000 iterations makes brute-force attacks computationally infeasible.

### Step R5: Initialize Last_T in Database
*   **Operation:** 
    Upon completion, set $\text{Last\_T} = 0$ in the database for the user account.
*   **Explanation:** For the user's first transaction, any valid timestamp $T > 0$ will pass validation checks. $\text{Last\_T}$ is updated with the timestamp of the latest successful transaction.

---

## 📱 Phase 2: Transaction — Sender Side (User's Phone)

### Step 1: User Starts a Transaction
*   **Inputs:**
    *   Sender = $A$
    *   Receiver = $B$
    *   Amount = $1000$
    *   Password = `userpass` (entered by user)
    *   Biometric = Fingerprint (scanned at time of transaction)
*   **Explanation:** Multi-factor authentication requires username + password + fingerprint. No single factor alone is enough.

### Step 2: Fingerprint Hashed Again (Same as Registration)
*   **Operation:**
    $$\text{BP\_hash} = \text{SHA-256}(\text{Fingerprint})$$
*   **Explanation:** Biometrics are hashed fresh for key derivation at every transaction. The raw fingerprint is never transmitted.

### Step 3: Construct AES Encryption Key
*   **Operation:**
    *   $T$ (Timestamp) = `1715600000` (Current Unix time)
    $$AES\_Key = \text{HMAC-SHA256}(K2\_stretched, \text{BP\_hash} \parallel T)$$
    $$AES\_Key = \text{HMAC-SHA256}(\text{'5e884898...'}, \text{'9f86d081...' + '1715600000'})$$
    $$AES\_Key = \text{2c26b46b68ffc68ff99b453c1d304134... (256-bit AES key)}$$
*   **Explanation:** The timestamp $T$ is embedded so the key rotates with every transaction.

### Step 4: Create Transaction Message M
*   **Operation:**
    $$M = \{ \text{Receiver: } B, \text{ Amount: } 1000, \text{ Timestamp: } 1715600000 \}$$
*   **Explanation:** Message $M$ is time-bound. Old messages cannot be reused (replay prevention).

### Step 5: Compute F1 = HMAC(K1, M) — Integrity Hash
*   **Operation:**
    $$F1 = \text{HMAC-SHA256}(K1, M)$$
    $$F1 = \text{HMAC-SHA256}(\text{'K1\_c7f3a9b82d14e056...'}, \text{'{Receiver:B, Amount:1000, Time:1715600000}'})$$
    $$F1 = \text{F1\_98f13708210194c475687be6106a3b84}$$
*   **Explanation:** $F1$ functions as the integrity seal. Any modification to $M$ yields a completely different $F1$. Using $K1$ binds the request to the registered device profile.

### Step 6: Combine M and F1
*   **Operation:**
    $$\text{Payload} = M \parallel F1$$
    $$\text{Payload} = \text{'{Receiver:B, Amount:1000, Time:1715600000}'} \parallel \text{'F1\_98f13708210194c475687be6106a3b84'}$$

### Step 7: Encrypt Payload Using AES-256
*   **Operation:**
    *   $IV$ (Initialization Vector) = `a1b2c3d4e5f6a7b8` (random, fresh each time)
    $$\text{Encrypted\_Data} = \text{AES-256-CBC}(AES\_Key, IV, \text{Payload})$$
    $$\text{Encrypted\_Data} = \text{6f1ed002ab5595859014ebf0951522d9... (ciphertext)}$$
*   **Explanation:** A fresh random $IV$ ensures the same message never produces duplicate ciphertext, defeating pattern analysis.

### Step 8: Send Packet to Bank Server
*   **Transmitted Packet:**
    *   $IV$ = `a1b2c3d4e5f6a7b8`
    *   $\text{Encrypted\_Data}$ = `6f1ed002ab5595859014ebf0951522d9...`
    *   $\text{Timestamp } (T)$ = `1715600000`
*   **Explanation:** Secret keys ($K1$, $K2$, password, fingerprint) are **NEVER** transmitted over the network.

---

## 🖥️ Phase 3: Transaction — Server Side (Bank Server)

### Step 1: Timestamp Validation — Replay Attack Prevention
*   **Operation:**
    *   Received $T$ = `1715600000`
    *   Server current time = `1715600120`
    *   $\text{Last\_T}$ from Database = `1715599500` (previous successful transaction)
    *   **Check 1:** Is $|\text{Current\_Time} - T| \le 180 \text{ seconds}$?
        $$|1715600120 - 1715600000| = 120 \text{ seconds} \implies \text{PASS}$$
    *   **Check 2:** Is $T > \text{Last\_T}$?
        $$1715600000 > 1715599500 \implies \text{PASS}$$
*   **Decisions:**
    *   If **Check 1** fails $\implies$ Request too old $\implies$ **REJECT**
    *   If **Check 2** fails $\implies$ Replay Attack detected $\implies$ **REJECT**
*   **Explanation:** Check 1 guarantees recent requests. Check 2 ensures a timestamp can never be reused.

### Step 2: Reconstruct AES Key at Server
*   **Operation:**
    *   Server retrieves: $K2\_stretched$, $BP\_hash$, $K1$ from database.
    $$AES\_Key = \text{HMAC-SHA256}(K2\_stretched, \text{BP\_hash} \parallel T)$$
    $$AES\_Key = \text{2c26b46b68ffc68ff99b453c1d304134...}$$

### Step 3: Decrypt the Ciphertext
*   **Operation:**
    $$\text{Payload} = \text{AES-256-Decrypt}(AES\_Key, IV, \text{Encrypted\_Data})$$
    $$\text{Payload} = \text{'{Receiver:B, Amount:1000, Time:1715600000}'} \parallel \text{F1\_98f13708...}$$
    *   Extract: $M = \{ \text{Receiver: } B, \text{ Amount: } 1000, \text{ Timestamp: } 1715600000 \}$
    *   Extract: $F1 = \text{F1\_98f13708210194c475687be6106a3b84}$

### Step 4: Verify Integrity — Recompute F2 and Compare
*   **Operation:**
    $$F2 = \text{HMAC-SHA256}(K1\_stored, M)$$
    $$F2 = \text{HMAC-SHA256}(\text{'K1\_c7f3a9b82d14e056...'}, \text{'{Receiver:B, Amount:1000, Time:1715600000}'})$$
    $$F2 = \text{F1\_98f13708210194c475687be6106a3b84}$$
    *   **Check:** Does $F1 == F2$?
        $$\text{F1\_98f13708...} == \text{F1\_98f13708...} \implies \text{MATCH (Message Accepted)}$$
    *   If $F1 \ne F2 \implies$ Message was tampered $\implies$ **REJECT**

### Step 5: Process Transaction
*   **Operation:**
    *   Verify Receiver $B$ exists in database $\implies$ **YES**
    *   Verify Sender $A$ balance $\ge$ Amount $\implies$ **YES**
    *   Deduct amount from Sender $A$'s balance
    *   Add amount to Receiver $B$'s balance
    *   Update database: Set $\text{Last\_T} = T$ (prevents reuse in next transactions)
    *   Send success notification
*   **Explanation:** Updating $\text{Last\_T}$ guarantees that any future transaction must have a strictly higher timestamp.
