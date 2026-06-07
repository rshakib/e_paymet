# COMPLETE_ENVIRONMENT_DOCUMENTATION.md

---

## 1. Client Environment Configuration (`.env`)

These environment variables are loaded by Expo at runtime.

### Variable: `EXPO_PUBLIC_BACKEND_URL`
* **Purpose**: Configures the base HTTP URL of the Python backend API. The client uses this string to prefix all request paths (e.g. `/auth/login`, `/auth/transfer`).
* **Required Format**: Must be an HTTP/HTTPS URL containing either the backend server's host IP (for local testing, e.g. `http://192.168.0.210:5000`) or the production domain name. Localhost (`http://127.0.0.1`) should be avoided for physical device deployments as they cannot route packets to the developer's loopback interface.
* **Files Using It**:
  * [src/services/api.ts](file:///E:/Apps/NiroPay/src/services/api.ts#L7) (Initializes `BACKEND_URL`).

---

## 2. Server Environment Configuration (`backend/.env.backend`)

These environment variables are loaded by the Python FastAPI server when it starts.

### A. Variable: `SUPABASE_URL`
* **Purpose**: Specifies the HTTPS API Gateway URL of the Supabase project instance hosting the database. Used to initialize database clients.
* **Required Format**: A standard Supabase project URL (e.g. `https://xsuwtumnpruytbuogvbp.supabase.co`).
* **Files Using It**:
  * [backend/supabase_config.py](file:///E:/Apps/NiroPay/backend/supabase_config.py)
  * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L23)

### B. Variable: `SUPABASE_KEY`
* **Purpose**: Authenticates the backend server with Supabase, granting access to database tables.
* **Required Format**: A valid Supabase Service Role JWT token. This token bypasses Row Level Security (RLS) policies, allowing the backend to perform database operations on behalf of users.
* **Files Using It**:
  * [backend/supabase_config.py](file:///E:/Apps/NiroPay/backend/supabase_config.py)
  * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L24)

### C. Variable: `SUPABASE_DB_PASSWORD`
* **Purpose**: Direct PostgreSQL database password. Used to establish direct TCP connections using `psycopg2`.
* **Required Format**: Cleartext password string matching the database user configured in Supabase.
* **Files Using It**:
  * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L25) (Initializes psycopg2 connections inside `init_db`, `search_users`, and other transactional handlers).

### D. Variable: `SECRET_KEY`
* **Purpose**: A symmetric key used by the `CryptoEngine` to encrypt and decrypt the outer secure envelope (Layer 1).
* **Required Format**: A 256-bit key represented as a 32-character string.
* **Files Using It**:
  * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L286)
  * [backend/crypto.py](file:///E:/Apps/NiroPay/backend/crypto.py)

### E. Variable: `DISABLE_REPLAY_TIME_CHECK`
* **Purpose**: Toggles client timestamp validation check on the `/auth/transfer` endpoint. Useful for development and testing when client and server times may be out of sync.
* **Required Format**: `'true'` or `'false'`. If set to `'true'`, the 180-second freshness check is bypassed.
* **Files Using It**:
  * [backend/app.py](file:///E:/Apps/NiroPay/backend/app.py#L1045)
