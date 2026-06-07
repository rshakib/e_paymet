# Migration Plan: FastAPI, Supabase, & HTTPS Render Deployment

This plan outlines the steps required to convert the backend from **Flask** to **FastAPI**, enable **database table auto-generation**, and deploy the server to **Render over HTTPS (SSL/TLS)** for secure data transfer between both your React web app and Expo mobile app.

---

## 🏗️ Architecture & HTTPS Communication Flow

```
┌─────────────────────────────────┐
│        Web Client (React)       │
│  (https:// VITE_BACKEND_URL)    │
└────────────────┬────────────────┘
                 │
                 │ HTTPS (Secured SSL/TLS)
                 ▼
┌─────────────────────────────────┐
│        FastAPI Backend          │
│   (HTTPS managed by Render)     │
└────────────────┬────────────────┘
                 │
                 │ [psycopg2] (Secure SSL connection to Supabase)
                 ▼
┌─────────────────────────────────┐
│  Supabase Cloud Database (Postgres)  │
└─────────────────────────────────┘
                 ▲
                 │
                 │ HTTPS (Secured SSL/TLS)
                 │
┌────────────────┬────────────────┘
│       Mobile Client (Expo)      │
│  (https:// EXPO_PUBLIC_BACKEND_URL)
└─────────────────────────────────┘
```

---

## 📅 Conversion & HTTPS Deployment Steps

### Phase 1: Code Modifications for Render & HTTPS

#### 1. CORS Configurations for Secure Origins
When connecting over HTTPS, web browsers block insecure cross-origin requests. We ensure FastAPI accepts credentials and handles origins correctly:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows HTTPS requests from React Web, Expo Mobile, and local apps
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 2. Dynamic Port Binding
Render handles HTTPS (SSL/TLS termination) at their load balancer level. They decrypt the traffic and forward it to your FastAPI server as standard HTTP on the dynamic `$PORT`:
```python
import os
import uvicorn

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
```

---

### Phase 2: Deploying to Render over HTTPS

Render automatically provisions, installs, and renews a free **Let's Encrypt SSL/TLS certificate** for your web service out-of-the-box. There is no need to write code to handle SSL files in Python.

1.  **Deploy Web Service on Render:**
    *   **Runtime:** `Python`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
    *   **Instance Type:** **Free**
2.  **Access Live Service:** Once deployed, Render provides an **`https://`** URL (e.g. `https://e-banking-backend.onrender.com`). All HTTP requests are automatically redirected to HTTPS.

---

### Phase 3: Client App HTTPS Configurations

Ensure that all client endpoints use the **`https://`** scheme instead of `http://`:

#### 1. React Web App Update
Update your frontend `.env` file to use `https`:
```env
# .env (Frontend Root)
VITE_BACKEND_URL=https://e-banking-backend.onrender.com
```

#### 2. Expo Mobile App Update
Configure the mobile client to connect using secure HTTPS:
```env
# mobile/.env
EXPO_PUBLIC_BACKEND_URL=https://e-banking-backend.onrender.com
```

---

### 🛠️ Local HTTPS Development (Optional)
If you need to test HTTPS locally on your development machine (e.g., to debug secure cookie handling or native device features):

#### Option A: Using Uvicorn with Self-Signed Certificates
1.  Generate self-signed certificate keys:
    ```bash
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes
    ```
2.  Start Uvicorn passing the SSL key and certificate files:
    ```bash
    uvicorn app:app --host 0.0.0.0 --port 5000 --ssl-keyfile=./key.pem --ssl-certfile=./cert.pem
    ```

#### Option B: Using ngrok (Recommended for Mobile testing)
ngrok exposes your local HTTP server (port 5000) through a secure public HTTPS tunnel:
```bash
ngrok http 5000
```
It will output a URL like `https://xxxx-xx-xx-xx.ngrok-free.app` which you can paste into your client `.env` files.

---

## 📋 Action Items & Migration Checklist

- [ ] Add `SUPABASE_DB_PASSWORD` to your local `.env.backend`.
- [ ] Install dependencies including `psycopg2-binary`, `fastapi`, and `uvicorn`.
- [ ] Convert `app.py` from Flask server to FastAPI server.
- [ ] Add the `lifespan` database table auto-initializer function to `app.py`.
- [ ] Enable `CORSMiddleware` in the FastAPI application.
- [ ] Push code changes to GitHub and deploy the repository to Render (HTTPS is automatically managed).
- [ ] Update frontend environment variables in both Web and Mobile apps to target the `https://` Render backend URL.
- [ ] Verify endpoints and transaction flows over HTTPS.
