from fastapi import FastAPI, Request, Header, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uuid
import datetime
import os
from dotenv import load_dotenv
from typing import Optional, Dict
from pydantic import BaseModel
# psycopg2 removed
import traceback
from contextlib import asynccontextmanager

from crypto import CryptoEngine
from supabase import create_client, Client
from supabase_config import SUPABASE_URL as CONFIG_URL, SUPABASE_KEY as CONFIG_KEY

# Load .env.backend first
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(script_dir, '.env.backend'), override=True)

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
SUPABASE_DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
SECRET_KEY = os.environ.get("SECRET_KEY")

# Startup Validation
missing_vars = []
if not SUPABASE_URL: missing_vars.append("SUPABASE_URL")
if not SUPABASE_KEY: missing_vars.append("SUPABASE_KEY")
if not SUPABASE_DB_PASSWORD: missing_vars.append("SUPABASE_DB_PASSWORD")
if not SECRET_KEY: missing_vars.append("SECRET_KEY")

if missing_vars:
    error_msg = f"CRITICAL ERROR: Missing required environment variables: {', '.join(missing_vars)}"
    print("=" * 60)
    print(error_msg)
    print("Please check your .env.backend file.")
    print("=" * 60)
    raise RuntimeError(error_msg)

def init_db():
    """Database tables initialization disabled for Render deployment"""
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB - Disabled direct PostgreSQL init_db() on startup
    # init_db()
    yield

app = FastAPI(lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crypto = CryptoEngine()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# SECRET_KEY is now loaded and validated at startup

# In-memory session store: token -> username
active_sessions: Dict[str, str] = {}

def generate_session_token() -> str:
    return str(uuid.uuid4())

# Models
class SecureEnvelope(BaseModel):
    payload: str
    hmac: str
    nonce: str
    timestamp: int

class LoginRequest(BaseModel):
    username: str
    password: str

class TransferRequest(BaseModel):
    username: str
    payload: str
    iv: str
    T: int

class RegisterRequest(BaseModel):
    username: str
    password: str
    nid: str
    activationCode: str
    macAddress: str
    bp_hash: str

# Dependency for Auth
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.replace("Bearer ", "")
    if token not in active_sessions:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return active_sessions[token]

# ========================================
# Helper Functions
# ========================================

def get_user_profile(username):
    """Fetch user profile by joining users and profiles tables"""
    try:
        # Fetch from users table first
        user_res = supabase.table('users').select('*').eq('username', username).execute()
        if not user_res.data or len(user_res.data) == 0:
            return None
        user = user_res.data[0]
        
        # Fetch from profiles table using user_nid
        profile_res = supabase.table('profiles').select('*').eq('user_nid', user['nid']).execute()
        profile_data = profile_res.data[0] if (profile_res.data and len(profile_res.data) > 0) else {}
        
        # Merge them
        merged = {
            'id': user['id'],
            'username': user['username'],
            'k2_stretched': user['k2_stretched'],
            'password_key_k2': user['k2_stretched'], # fallback
            'bp_hash': user['bp_hash'],
            'fingerprint_bp': user['bp_hash'], # fallback
            'k1': user['k1'],
            'hmac_key_k1': user['k1'], # fallback
            'last_t': user.get('last_t', 0),
            'daily_limit': 5000.0,
            'today_spent': 0.0,
            'last_spent_reset_date': profile_data.get('last_spent_reset_date'),
            'nid': user.get('nid'),
            'full_name': user.get('full_name') or 'User',
            'mobile_number': user.get('mobile_number') or '',
            'biometric_registered': user.get('biometric_registered', False),
            'has_fingerprint': user.get('biometric_registered', False), # fallback
            'face_registered': user.get('face_registered', False),
            'has_face_id': user.get('face_registered', False), # fallback
            'profile_picture_url': profile_data.get('profile_picture_url'),
            'favorites': profile_data.get('favorites', [])
        }
        return merged
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None

def get_user_account(profile_id):
    """Fetch user's primary account from Supabase accounts table"""
    try:
        response = supabase.table('accounts').select('*').eq('profile_id', profile_id).eq('is_active', True).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error fetching account: {e}")
        return None

def get_receiver_account(receiver_username):
    """Fetch receiver's account"""
    try:
        receiver_profile = get_user_profile(receiver_username)
        if not receiver_profile:
            return None
        return get_user_account(receiver_profile['id'])
    except Exception as e:
        print(f"Error fetching receiver account: {e}")
        return None

def record_transaction(sender_account_id, receiver_account_id, amount, status, failure_reason=None):
    """Record transaction in Supabase transactions table"""
    try:
        transaction_data = {
            'sender_account_id': sender_account_id,
            'receiver_account_id': receiver_account_id,
            'amount': float(amount),
            'status': status,
            'failure_reason': failure_reason,
            'reference': f"TXN-{datetime.datetime.now().isoformat()}"
        }
        response = supabase.table('transactions').insert(transaction_data).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"Error recording transaction: {e}")
        return None

def update_account_balance(account_id, new_balance):
    """Update account balance in Supabase"""
    try:
        supabase.table('accounts').update({'balance': float(new_balance)}).eq('id', account_id).execute()
        return True
    except Exception as e:
        print(f"Error updating balance: {e}")
        return False

def update_profile_timestamp(profile_id, new_t):
    """Update user's timestamp (T) in Supabase users table"""
    try:
        supabase.table('users').update({'last_t': new_t}).eq('id', profile_id).execute()
        return True
    except Exception as e:
        print(f"Error updating timestamp: {e}")
        return False

# ========================================
# API Endpoints
# ========================================

@app.get('/health')
async def health():
    """Health check endpoint"""
    return {"status": "ok", "message": "E-Banking API is running"}

@app.post('/login')
async def login(data: LoginRequest):
    """Authenticate user with PBKDF2 stretching and legacy migration"""
    try:
        username = data.username
        password = data.password

        if not username or not password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing username or password"})

        # Fetch profile
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        stored_k2 = user_profile.get('password_key_k2')
        nid = user_profile.get('nid')
        
        authenticated = False
        migrated = False

        # 1. Attempt PBKDF2 verification if NID is available
        if nid:
            stretched_password = crypto.stretch_password(password, nid)
            if stretched_password == stored_k2:
                authenticated = True

        # 2. Fallback to plaintext comparison (Legacy User Migration)
        if not authenticated:
            if stored_k2 == password:
                authenticated = True
                # If we have an NID, we can migrate them now
                if nid:
                    new_k2 = crypto.stretch_password(password, nid)
                    supabase.table('users').update({'k2_stretched': new_k2}).eq('id', user_profile['id']).execute()
                    migrated = True
                    print(f"User {username} migrated to stretched password during login.")

        if not authenticated:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid password"})

        # Fetch account
        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Account not found"})

        token = generate_session_token()
        active_sessions[token] = username

        return {
            "status": "success",
            "token": token,
            "migrated": migrated,
            "user": {
                "id": user_profile['id'],
                "username": user_profile['username'],
                "k1": user_profile['k1'],
                "k2": stored_k2 if not migrated else new_k2,
                "bp": user_profile['bp_hash'],
                "last_t": user_profile['last_t'],
                "balance": float(user_account['balance']),
                "accountId": user_account['id'],
                "daily_limit": float(user_profile.get('daily_limit', 5000)),
                "today_spent": float(user_profile.get('today_spent', 0)),
                "last_spent_reset_date": str(user_profile.get('last_spent_reset_date')) if user_profile.get('last_spent_reset_date') else None,
            }
        }

    except Exception as e:
        print(f"Login error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@app.post('/transfer')
async def process_transfer(data: TransferRequest, username_from_token: str = Depends(get_current_user)):
    """Process secure money transfer with cryptographic verification"""
    try:
        username = data.username
        encrypted_payload = data.payload
        iv_base64 = data.iv
        t_from_client = data.T

        if not all([username, encrypted_payload, iv_base64, t_from_client]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required transfer fields"})
        
        # Verify that the username in request matches the authenticated user
        if username != username_from_token:
             return JSONResponse(status_code=403, content={"status": "error", "message": "Unauthorized username"})

        # 1. Fetch user from Supabase
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User account not found"})

        # 2. Decryption (K2, BP, T from client)
        # We use T from client for decryption key derivation as per specification
        decrypted_data = crypto.decrypt_data(
            encrypted_payload,
            iv_base64,
            user_profile['password_key_k2'],
            user_profile['fingerprint_bp'],
            t_from_client
        )

        if not decrypted_data:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Decryption failed or invalid key parameters"})

        message_m = decrypted_data['M']  # "Receiver:Bob|Amt:1000|T:12345"
        f1_from_user = decrypted_data['F1']

        # 3. Integrity check (HMAC verification)
        f2_generated = crypto.generate_hmac(user_profile['hmac_key_k1'], message_m)

        if f1_from_user != f2_generated:
            record_transaction(user_account['id'], None, 0, 'aborted', 'HMAC mismatch')
            return JSONResponse(status_code=403, content={"status": "error", "message": "Data integrity compromised (HMAC mismatch)"})

        # 3.5 Replay Protection
        server_t = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        disable_replay_check = os.environ.get('DISABLE_REPLAY_TIME_CHECK', 'false').lower() == 'true'

        if not disable_replay_check:
            # Freshness check: T must be within 180 seconds
            if abs(server_t - t_from_client) > 180:
                return JSONResponse(status_code=403, content={"status": "error", "message": "Transaction expired (Time out of sync)"})
            
            # Sequence check: T must be strictly greater than last_t
            if t_from_client <= user_profile.get('last_t', 0):
                return JSONResponse(status_code=403, content={"status": "error", "message": "Replay attack detected (Invalid timestamp sequence)"})

        # 4. Data extraction
        try:
            parts = message_m.split('|')
            receiver_username = parts[0].split(':')[1]
            amount = float(parts[1].split(':')[1])
        except Exception:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid message format"})

        # 5. Execute transfer via Atomic Stored Procedure (Supabase RPC)
        # This handles: balance check, daily limit check, replay protection (seq), 
        # and atomic balance updates in a single DB transaction.
        try:
            rpc_params = {
                'p_sender_username': username,
                'p_receiver_username': receiver_username,
                'p_amount': float(amount),
                'p_timestamp': int(t_from_client),
                'p_reference': f"TXN-{datetime.datetime.now(datetime.timezone.utc).isoformat()}"
            }
            
            rpc_response = supabase.rpc('process_transfer_secure', rpc_params).execute()
            
            if not rpc_response.data:
                return JSONResponse(status_code=500, content={"status": "error", "message": "Database transaction failed"})
            
            result = rpc_response.data
            
            if result['status'] == 'success':
                return {
                    "status": "success",
                    "message": f"Transfer of {amount} to {receiver_username} successful",
                    "new_t": t_from_client,
                    "new_balance": result['new_balance']
                }
            elif result['status'] == 'futile':
                return JSONResponse(status_code=400, content={"status": "futile", "message": result['message']})
            else:
                return JSONResponse(status_code=403, content={"status": "error", "message": result['message']})

        except Exception as rpc_err:
            print(f"RPC Error: {rpc_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": "Atomic transaction error"})

    except Exception as e:
        print(f"Transfer error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

@app.get('/user/{username}')
async def get_user(username: str, username_from_token: str = Depends(get_current_user)):
    """Get user profile and account information"""
    try:
        # For security, we might want to restrict this to the logged in user
        if username != username_from_token:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden"})

        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Account not found"})

        return {
            "status": "success",
            "user": {
                "id": user_profile['id'],
                "username": user_profile['username'],
                "balance": float(user_account['balance']),
                "daily_limit": float(user_profile['daily_limit']),
                "today_spent": float(user_profile['today_spent']),
                "full_name": user_profile.get('full_name') or 'User',
                "mobile_number": user_profile.get('mobile_number') or '',
                "nid": user_profile.get('nid') or '',
                "date_of_birth": user_profile.get('date_of_birth') or '',
                "has_fingerprint": bool(user_profile.get('has_fingerprint', False)),
                "has_face_id": bool(user_profile.get('has_face_id', False)),
            }
        }
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

@app.get('/transactions/{username}')
async def get_transactions(username: str, username_from_token: str = Depends(get_current_user)):
    """Get user's transaction history (both sent and received)"""
    try:
        if username != username_from_token:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden"})

        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Account not found"})

        # Fetch both sent AND received transactions
        sent_response = supabase.table('transactions').select('*').eq('sender_account_id', user_account['id']).order('created_at', desc=True).limit(20).execute()
        
        # Get received transactions
        received_response = supabase.table('transactions').select('*').eq('receiver_account_id', user_account['id']).order('created_at', desc=True).limit(20).execute()

        transactions = []
        
        # Process sent transactions
        if sent_response.data:
            for txn in sent_response.data:
                # Get receiver name
                receiver_name = 'External'
                ref = txn.get('reference', '')
                
                if txn.get('receiver_account_id'):
                    receiver_account = supabase.table('accounts').select('profile_id').eq('id', txn['receiver_account_id']).execute()
                    if receiver_account.data:
                        receiver_profile = supabase.table('users').select('username').eq('id', receiver_account.data[0]['profile_id']).execute()
                        if receiver_profile.data and len(receiver_profile.data) > 0:
                            receiver_name = receiver_profile.data[0]['username']
                
                # Categorize based on reference
                category = 'transfer'
                if 'Recharge' in ref:
                    category = 'recharge'
                elif 'Bill' in ref:
                    category = 'bill'
                elif 'Merchant' in ref:
                    category = 'payment'

                transactions.append({
                    "id": txn['id'],
                    "amount": float(txn['amount']),
                    "status": txn['status'],
                    "created_at": txn['created_at'],
                    "reference": ref,
                    "receiver_username": receiver_name,
                    "type": "sent",
                    "category": category
                })
        
        # Process received transactions
        if received_response.data:
            for txn in received_response.data:
                # Get sender name
                sender_name = 'External'
                ref = txn.get('reference', '')
                if txn.get('sender_account_id'):
                    sender_account = supabase.table('accounts').select('profile_id').eq('id', txn['sender_account_id']).execute()
                    if sender_account.data:
                        sender_profile = supabase.table('users').select('username').eq('id', sender_account.data[0]['profile_id']).execute()
                        if sender_profile.data and len(sender_profile.data) > 0:
                            sender_name = sender_profile.data[0]['username']
                
                # Categorize based on reference
                category = 'transfer'
                if 'Recharge' in ref:
                    category = 'recharge'
                elif 'Bill' in ref:
                    category = 'bill'
                elif 'Merchant' in ref:
                    category = 'payment'

                transactions.append({
                    "id": txn['id'],
                    "amount": float(txn['amount']),
                    "status": txn['status'],
                    "created_at": txn['created_at'],
                    "reference": ref,
                    "sender_username": sender_name,
                    "type": "received",
                    "category": category
                })
        
        # Sort all transactions by date (most recent first)
        transactions.sort(key=lambda x: x['created_at'], reverse=True)

        return {
            "status": "success",
            "transactions": transactions
        }
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

@app.post('/register')
async def register(data: RegisterRequest):
    """Register a new user account with cryptographic compliance"""
    try:
        username = data.username
        password = data.password
        nid = data.nid
        activation_code = data.activationCode
        mac_address = data.macAddress
        bp_hash = data.bp_hash

        if not all([username, password, nid, activation_code, mac_address, bp_hash]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required registration fields"})

        # Check if user already exists
        existing_profile = get_user_profile(username)
        if existing_profile:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Username already exists"})

        # Step 1: Create Supabase Auth user (still using raw password for Supabase Auth, 
        # but profiles table will store stretched K2)
        synthetic_email = f"{username}@ebanking.internal"
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": synthetic_email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"username": username}
            })
            auth_user_id = auth_response.user.id
        except Exception as auth_err:
            print(f"Auth user creation error: {auth_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": f"Auth error: {str(auth_err)}"})

        # Step 2: Cryptographic Key Generation
        # K2: PBKDF2 stretched password using NID as salt
        k2_stretched = crypto.stretch_password(password, nid)
        
        # K1: Physical hardware-bound key (HMAC-SHA256(Activation_Code || NID, MAC_Address || BP_hash))
        k1_key = f"{activation_code}{nid}"
        k1_msg = f"{mac_address}{bp_hash}"
        k1 = crypto.generate_hmac(k1_key, k1_msg)
        
        last_t = 0

        # Insert into users table
        user_data = {
            'id': auth_user_id,
            'nid': nid,
            'full_name': 'User',
            'username': username,
            'mobile_number': '',
            'activation_code': activation_code,
            'bp_hash': bp_hash,
            'k1': k1,
            'k2_stretched': k2_stretched,
            'last_t': last_t,
            'balance': 0.0,
            'face_registered': False,
            'biometric_registered': False
        }

        user_response = supabase.table('users').insert(user_data).execute()
        if not user_response.data:
            # Clean up orphaned auth user
            try:
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception:
                pass
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to create user"})

        # Insert into profiles table (approved schema)
        profile_data = {
            'id': auth_user_id,
            'user_nid': nid,
            'profile_picture_url': None,
            'favorites': []
        }

        response = supabase.table('profiles').insert(profile_data).execute()
        if not response.data:
            # Clean up users record and auth user
            try:
                supabase.table('users').delete().eq('id', auth_user_id).execute()
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception:
                pass
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to create profile"})

        profile_id = response.data[0]['id']

        # Step 3: Create linked bank account
        account_data = {
            'profile_id': profile_id,
            'balance': 5000.0,
            'is_active': True,
            'account_number': f"ACC-{username}"
        }
        supabase.table('accounts').insert(account_data).execute()

        return JSONResponse(status_code=201, content={"status": "success", "message": "Account created successfully"})

    except Exception as e:
        print(f"Registration error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Database error: {str(e)}"})

@app.get('/check-receiver/{username}')
async def check_receiver(username: str, username_from_token: str = Depends(get_current_user)):
    """Check if a receiver username exists"""
    try:
        profile = get_user_profile(username)
        if not profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Receiver not found"})
        return {
            "status": "success",
            "username": profile['username'],
            "full_name": profile.get('full_name') or '',
            "role": profile.get('role') or 'user'
        }
    except Exception as e:
        print(f"Check receiver error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

# ========================================
# Secure API Endpoints (Outer envelope + Cryptographic workflows)
# ========================================

@app.post('/auth/register')
async def auth_register(envelope: SecureEnvelope):
    """Register a new user account with cryptographic compliance wrapped in secure envelope"""
    try:
        # Decrypt outer envelope
        data = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if data is None:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed or invalid signature"})

        username = data.get('username')
        password = data.get('pin')  # pin on client is password/K2 on server
        nid = data.get('nid_number')
        activation_code = data.get('activation_code')
        mac_address = data.get('mac_address')
        bp_hash = data.get('bp_hash')
        full_name = data.get('full_name') or 'User'
        mobile_number = data.get('mobile_number')
        has_fingerprint = bool(data.get('has_fingerprint', False))
        has_face_id = bool(data.get('has_face_id', False))

        if not all([username, password, nid, activation_code, mac_address, bp_hash]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required registration fields"})

        # Check if user already exists
        existing_profile = get_user_profile(username)
        if existing_profile:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Username already exists"})

        # Step 1: Create Supabase Auth user (synthetic email)
        synthetic_email = f"{username}@ebanking.internal"
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": synthetic_email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"username": username}
            })
            auth_user_id = auth_response.user.id
        except Exception as auth_err:
            print(f"Auth user creation error: {auth_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": f"Auth error: {str(auth_err)}"})

        # Step 2: Cryptographic Key Generation
        # K2: PBKDF2 stretched password using NID as salt
        k2_stretched = crypto.stretch_password(password, nid)
        
        # K1: Physical hardware-bound key
        k1_key = f"{activation_code}{nid}"
        k1_msg = f"{mac_address}{bp_hash}"
        k1 = crypto.generate_hmac(k1_key, k1_msg)
        
        last_t = 0

        # Insert into users table
        user_data = {
            'id': auth_user_id,
            'nid': nid,
            'full_name': full_name,
            'username': username,
            'mobile_number': mobile_number,
            'activation_code': activation_code,
            'bp_hash': bp_hash,
            'k1': k1,
            'k2_stretched': k2_stretched,
            'last_t': last_t,
            'balance': 0.0,
            'face_registered': has_face_id,
            'biometric_registered': has_fingerprint
        }

        user_response = supabase.table('users').insert(user_data).execute()
        if not user_response.data:
            # Clean up orphaned auth user
            try:
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception:
                pass
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to create user record"})

        # Insert into profiles table (approved schema)
        profile_data = {
            'id': auth_user_id,
            'user_nid': nid,
            'profile_picture_url': None,
            'favorites': []
        }

        response = supabase.table('profiles').insert(profile_data).execute()
        if not response.data:
            # Clean up users record and auth user
            try:
                supabase.table('users').delete().eq('id', auth_user_id).execute()
                supabase.auth.admin.delete_user(auth_user_id)
            except Exception:
                pass
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to create profile record"})

        profile_id = response.data[0]['id']

        # Step 3: Create linked bank account
        account_data = {
            'profile_id': profile_id,
            'balance': 5000.0,
            'is_active': True,
            'account_number': f"ACC-{username}"
        }
        supabase.table('accounts').insert(account_data).execute()

        response_data = {"success": True, "message": "Account created successfully"}
        return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)

    except Exception as e:
        print(f"Registration error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Database error: {str(e)}"})


@app.post('/auth/login')
async def auth_login(envelope: SecureEnvelope):
    """Authenticate user wrapped in secure outer envelope"""
    try:
        # Decrypt outer envelope
        data = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if data is None:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed or invalid signature"})

        username = data.get('username')
        password = data.get('pin')  # pin on client is password/K2 on server

        if not username or not password:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing username or password"})

        # Fetch profile
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        stored_k2 = user_profile.get('password_key_k2')
        nid = user_profile.get('nid')
        
        authenticated = False
        migrated = False

        # 1. Attempt PBKDF2 verification if NID is available
        if nid:
            stretched_password = crypto.stretch_password(password, nid)
            if stretched_password == stored_k2:
                authenticated = True

        # 2. Fallback to plaintext comparison (Legacy User Migration)
        if not authenticated:
            if stored_k2 == password:
                authenticated = True
                # If we have an NID, we can migrate them now
                if nid:
                    new_k2 = crypto.stretch_password(password, nid)
                    supabase.table('users').update({'k2_stretched': new_k2}).eq('id', user_profile['id']).execute()
                    migrated = True
                    print(f"User {username} migrated to stretched password during login.")

        if not authenticated:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid password"})

        # Fetch account
        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "Account not found"})

        token = generate_session_token()
        active_sessions[token] = username

        response_data = {
            "access_token": token,
            "user": {
                "id": user_profile['id'],
                "username": user_profile['username'],
                "full_name": user_profile.get('full_name') or 'User',
                "balance": float(user_account['balance']),
                "has_fingerprint": bool(user_profile.get('has_fingerprint', False)),
                "has_face_id": bool(user_profile.get('has_face_id', False)),
                "k1": user_profile.get('hmac_key_k1'),
                "k2": stored_k2 if not migrated else new_k2,
                "bp": user_profile.get('fingerprint_bp'),
                "last_t": int(user_profile.get('last_t', 0))
            }
        }
        return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)

    except Exception as e:
        print(f"Login error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@app.post('/auth/logout')
async def auth_logout(envelope: SecureEnvelope):
    """Logout session wrapped in secure outer envelope"""
    try:
        data = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if data is None:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed"})

        # Logout is successful
        response_data = {"success": True, "message": "Logged out successfully"}
        return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)
    except Exception as e:
        print(f"Logout error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@app.post('/auth/transfer')
async def auth_transfer(envelope: SecureEnvelope):
    """Process money transfer wrapped in outer secure envelope, complying with security.pdf"""
    try:
        # 1. Decrypt Layer 1 (Outer Envelope)
        inner_body = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if not inner_body:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed"})
        
        # 2. Extract fields from decrypted body
        username = inner_body.get('username')
        encrypted_payload = inner_body.get('payload')
        iv_base64 = inner_body.get('iv')
        t_from_client = inner_body.get('T')

        if not all([username, encrypted_payload, iv_base64, t_from_client is not None]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required transfer fields"})

        # 3. Fetch user profiles and accounts
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        user_account = get_user_account(user_profile['id'])
        if not user_account:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User account not found"})

        # 4. Decrypt Layer 2 (Inner Transaction Security)
        decrypted_data = crypto.decrypt_data(
            encrypted_payload,
            iv_base64,
            user_profile['password_key_k2'],
            user_profile['fingerprint_bp'],
            t_from_client
        )

        if not decrypted_data:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Decryption failed or invalid key parameters"})

        message_m = decrypted_data['M']  # "Receiver:Bob|Amt:1000|T:12345"
        f1_from_user = decrypted_data['F1']

        # 5. Integrity check (HMAC verification)
        f2_generated = crypto.generate_hmac(user_profile['hmac_key_k1'], message_m)

        if f1_from_user != f2_generated:
            record_transaction(user_account['id'], None, 0, 'aborted', 'HMAC mismatch')
            return JSONResponse(status_code=403, content={"status": "error", "message": "Data integrity compromised (HMAC mismatch)"})

        # 6. Replay Protection
        server_t = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        disable_replay_check = os.environ.get('DISABLE_REPLAY_TIME_CHECK', 'false').lower() == 'true'

        if not disable_replay_check:
            # Freshness check: T must be within 180 seconds
            if abs(server_t - t_from_client) > 180:
                return JSONResponse(status_code=403, content={"status": "error", "message": "Transaction expired (Time out of sync)"})
            
            # Sequence check: T must be strictly greater than last_t
            if t_from_client <= user_profile.get('last_t', 0):
                return JSONResponse(status_code=403, content={"status": "error", "message": "Replay attack detected (Invalid timestamp sequence)"})

        # 7. Extract receiver and amount from transaction message M
        try:
            parts = message_m.split('|')
            receiver_username = parts[0].split(':')[1]
            amount = float(parts[1].split(':')[1])
        except Exception:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid message format"})

        # 8. Execute transfer via Atomic Stored Procedure (Supabase RPC)
        try:
            rpc_params = {
                'p_sender_username': username,
                'p_receiver_username': receiver_username,
                'p_amount': float(amount),
                'p_timestamp': int(t_from_client),
                'p_reference': f"TXN-{datetime.datetime.now(datetime.timezone.utc).isoformat()}"
            }
            
            rpc_response = supabase.rpc('process_transfer_secure', rpc_params).execute()
            
            if not rpc_response.data:
                return JSONResponse(status_code=500, content={"status": "error", "message": "Database transaction failed"})
            
            result = rpc_response.data
            
            if result['status'] == 'success':
                response_data = {
                    "status": "success",
                    "message": f"Transfer of {amount} to {receiver_username} successful",
                    "new_t": t_from_client,
                    "new_balance": result['new_balance']
                }
                return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)
            elif result['status'] == 'futile':
                return JSONResponse(status_code=400, content={"status": "futile", "message": result['msg']})
            else:
                return JSONResponse(status_code=403, content={"status": "error", "message": result['msg']})

        except Exception as rpc_err:
            print(f"RPC Error: {rpc_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": "Atomic transaction error"})

    except Exception as e:
        print(f"Transfer error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

# ========================================
# Additional Audited Features Endpoints
# ========================================

class RechargeRequest(BaseModel):
    phone: str
    amount: float
    operator: str

class BillPayRequest(BaseModel):
    bill_id: str

class MerchantPaymentRequest(BaseModel):
    merchant_username: str
    amount: float

class ContactsMatchRequest(BaseModel):
    phone_numbers: list

@app.get('/recharge/operators')
async def get_operators():
    """Get list of mobile operators for recharge"""
    return {
        "status": "success",
        "operators": [
            { "id": "gp", "name": "Grameenphone", "prefix": ["017", "013"], "color": "#00A8FF", "logoColor": "#E1F5FE" },
            { "id": "robi", "name": "Robi", "prefix": ["018"], "color": "#FF3F34", "logoColor": "#FFEBEE" },
            { "id": "airtel", "name": "Airtel", "prefix": ["016"], "color": "#EA2027", "logoColor": "#FFEBEE" },
            { "id": "bl", "name": "Banglalink", "prefix": ["019", "014"], "color": "#FF9F1A", "logoColor": "#FFF3E0" },
            { "id": "tt", "name": "Teletalk", "prefix": ["015"], "color": "#2ED573", "logoColor": "#E8F5E9" }
        ]
    }

@app.get('/search-users')
async def search_users(q: str, username_from_token: str = Depends(get_current_user)):
    """Search for users in database by query string q (username, full_name, mobile_number)"""
    try:
        query_pattern = f"%{q}%"
        or_filter = f"username.ilike.{query_pattern},full_name.ilike.{query_pattern},mobile_number.ilike.{query_pattern}"
        
        response = supabase.table('users').select('id, username, full_name, mobile_number')\
            .or_(or_filter)\
            .neq('username', username_from_token)\
            .limit(15)\
            .execute()
        
        users_list = []
        if response.data:
            for r in response.data:
                users_list.append({
                    "id": r.get('id'),
                    "username": r.get('username'),
                    "full_name": r.get('full_name') or '',
                    "mobile_number": r.get('mobile_number') or ''
                })
            
        return {"status": "success", "users": users_list}
    except Exception as e:
        print(f"Search users error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Database search error: {str(e)}"})

@app.post('/contacts/match')
async def match_contacts(data: ContactsMatchRequest, username_from_token: str = Depends(get_current_user)):
    """Match phone numbers against profiles database and return registered users only"""
    try:
        # 1. Clean and normalize incoming phone numbers to last 10 digits
        last_10_list = []
        for num in data.phone_numbers:
            clean = "".join(c for c in num if c.isdigit())
            if len(clean) >= 10:
                last_10_list.append(clean[-10:])
                
        if not last_10_list:
            return {"status": "success", "matched_users": []}

        # 2. Query matching profiles
        or_conditions = []
        for num in last_10_list:
            or_conditions.append(f"mobile_number.ilike.%{num}")
            or_conditions.append(f"username.ilike.%{num}")
        or_filter_str = ",".join(or_conditions)

        response = supabase.table('users').select('id, username, full_name, mobile_number')\
            .or_(or_filter_str)\
            .neq('username', username_from_token)\
            .limit(100)\
            .execute()
        
        matched = []
        if response.data:
            for r in response.data:
                matched.append({
                    "id": r.get('id'),
                    "username": r.get('username'),
                    "full_name": r.get('full_name') or '',
                    "mobile_number": r.get('mobile_number') or ''
                })
            
        return {"status": "success", "matched_users": matched}
    except Exception as e:
        print(f"Match contacts error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Database match error: {str(e)}"})

@app.get('/bills/{username}')
async def get_bills(username: str, username_from_token: str = Depends(get_current_user)):
    """Get list of utility bills for the user"""
    try:
        if username != username_from_token:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden"})
            
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})
            
        response = supabase.table('bills').select('id, biller_name, bill_number, amount, due_date, status, paid_at')\
            .eq('profile_id', user_profile['id'])\
            .order('created_at', desc=True)\
            .execute()
        
        bills_list = []
        if response.data:
            for b in response.data:
                due_date_val = b.get('due_date')
                paid_at_val = b.get('paid_at')
                bills_list.append({
                    "id": b.get('id'),
                    "biller_name": b.get('biller_name'),
                    "bill_number": b.get('bill_number'),
                    "amount": float(b.get('amount')) if b.get('amount') is not None else 0.0,
                    "due_date": str(due_date_val) if due_date_val is not None else '',
                    "status": b.get('status'),
                    "paid_at": str(paid_at_val) if paid_at_val is not None else None
                })
            
        return {"status": "success", "bills": bills_list}
    except Exception as e:
        print(f"Get bills error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to retrieve bills"})

@app.post('/bills/pay')
async def pay_bill(envelope: SecureEnvelope, username_from_token: str = Depends(get_current_user)):
    """Pay utility bill wrapped in secure outer envelope"""
    try:
        # 1. Decrypt Layer 1 (Outer Envelope)
        inner_body = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if not inner_body:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed or invalid signature"})
        
        # 2. Extract fields from decrypted body
        username = inner_body.get('username')
        encrypted_payload = inner_body.get('payload')
        iv_base64 = inner_body.get('iv')
        t_from_client = inner_body.get('T')

        if not all([username, encrypted_payload, iv_base64, t_from_client is not None]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required bill payment fields"})

        # Security Check: Match token with payload
        if username != username_from_token:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden: Token mismatch"})

        # 3. Fetch user profile
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        # 4. Decrypt Layer 2 (Inner Transaction Security)
        decrypted_data = crypto.decrypt_data(
            encrypted_payload,
            iv_base64,
            user_profile['password_key_k2'],
            user_profile['fingerprint_bp'],
            t_from_client
        )

        if not decrypted_data:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Decryption failed or invalid key parameters"})

        message_m = decrypted_data['M']  # "BillID:uuid|Amt:amount"
        f1_from_user = decrypted_data['F1']

        # 5. Integrity check (HMAC verification)
        f2_generated = crypto.generate_hmac(user_profile['hmac_key_k1'], message_m)

        if f1_from_user != f2_generated:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Data integrity compromised (HMAC mismatch)"})

        # 6. Replay Protection
        server_t = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        if abs(server_t - t_from_client) > 180:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Transaction expired (Time out of sync)"})
        
        if t_from_client <= user_profile.get('last_t', 0):
            return JSONResponse(status_code=403, content={"status": "error", "message": "Replay attack detected (Invalid timestamp sequence)"})

        # 7. Extract Bill ID and amount from transaction message M
        try:
            # Expected M format: "BillID:uuid|Amt:100.0"
            parts = message_m.split('|')
            bill_id = parts[0].split(':')[1]
            amount = float(parts[1].split(':')[1])
        except Exception:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid message format"})

        # 8. Execute bill payment via Atomic Stored Procedure
        try:
            rpc_params = {
                'p_username': username,
                'p_bill_id': bill_id,
                'p_timestamp': int(t_from_client),
                'p_reference': f"Bill Payment: {bill_id}"
            }
            
            rpc_response = supabase.rpc('process_bill_pay_secure', rpc_params).execute()
            
            if not rpc_response.data:
                return JSONResponse(status_code=500, content={"status": "error", "message": "Database transaction failed"})
            
            result = rpc_response.data
            
            if result['status'] == 'success':
                response_data = {
                    "status": "success",
                    "message": "Bill payment successful",
                    "new_balance": result['new_balance'],
                    "new_t": t_from_client
                }
                return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)
            else:
                return JSONResponse(status_code=400, content={"status": "error", "message": result['message']})

        except Exception as rpc_err:
            print(f"RPC Error: {rpc_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": "Atomic transaction error"})

    except Exception as e:
        print(f"Pay bill error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Payment processing error: {str(e)}"})

@app.post('/auth/recharge')
async def mobile_recharge(envelope: SecureEnvelope, username_from_token: str = Depends(get_current_user)):
    """Process mobile airtime recharge wrapped in secure outer envelope"""
    try:
        # 1. Decrypt Layer 1 (Outer Envelope)
        inner_body = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if not inner_body:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed or invalid signature"})

        # 2. Extract fields from decrypted body
        username = inner_body.get('username')
        encrypted_payload = inner_body.get('payload')
        iv_base64 = inner_body.get('iv')
        t_from_client = inner_body.get('T')

        if not all([username, encrypted_payload, iv_base64, t_from_client is not None]):
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required recharge fields"})

        # Security Check: Match token with payload
        if username != username_from_token:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden: Token mismatch"})

        # 3. Fetch user profile
        user_profile = get_user_profile(username)
        if not user_profile:
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        # 4. Decrypt Layer 2 (Inner Transaction Security)
        decrypted_data = crypto.decrypt_data(
            encrypted_payload,
            iv_base64,
            user_profile['password_key_k2'],
            user_profile['fingerprint_bp'],
            t_from_client
        )

        if not decrypted_data:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Decryption failed or invalid key parameters"})

        message_m = decrypted_data['M']  # "Phone:017XXXXXXXX|Amt:100.0|Operator:GP"
        f1_from_user = decrypted_data['F1']

        # 5. Integrity check (HMAC verification)
        f2_generated = crypto.generate_hmac(user_profile['hmac_key_k1'], message_m)

        if f1_from_user != f2_generated:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Data integrity compromised (HMAC mismatch)"})

        # 6. Replay Protection
        server_t = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        if abs(server_t - t_from_client) > 180:
            return JSONResponse(status_code=403, content={"status": "error", "message": "Transaction expired (Time out of sync)"})

        if t_from_client <= user_profile.get('last_t', 0):
            return JSONResponse(status_code=403, content={"status": "error", "message": "Replay attack detected (Invalid timestamp sequence)"})

        # 7. Extract phone, amount, and operator from transaction message M
        try:
            # Expected M format: "Phone:017XXXXXXXX|Amt:100.0|Operator:GP"
            parts = message_m.split('|')
            phone = parts[0].split(':')[1]
            amount = float(parts[1].split(':')[1])
            operator = parts[2].split(':')[1]
        except Exception:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid message format"})

        # 8. Execute recharge via Atomic Stored Procedure
        try:
            rpc_params = {
                'p_username': username,
                'p_amount': float(amount),
                'p_timestamp': int(t_from_client),
                'p_reference': f"Recharge to {phone} ({operator})"
            }

            rpc_response = supabase.rpc('process_recharge_secure', rpc_params).execute()

            if not rpc_response.data:
                return JSONResponse(status_code=500, content={"status": "error", "message": "Database transaction failed"})

            result = rpc_response.data

            if result['status'] == 'success':
                response_data = {
                    "status": "success",
                    "message": f"Recharge of {amount} to {phone} successful",
                    "new_balance": result['new_balance'],
                    "new_t": t_from_client
                }
                return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)
            else:
                return JSONResponse(status_code=400, content={"status": "error", "message": result['message']})

        except Exception as rpc_err:
            print(f"RPC Error: {rpc_err}")
            return JSONResponse(status_code=500, content={"status": "error", "message": "Atomic transaction error"})

    except Exception as e:
        print(f"Recharge error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})

@app.post('/auth/merchant-payment')
async def merchant_payment(envelope: SecureEnvelope, username_from_token: str = Depends(get_current_user)):
    """Process merchant payment wrapped in secure outer envelope"""
    print(f"[AUDIT] Entry: /auth/merchant-payment for user {username_from_token}")
    try:
        # 1. Decrypt Layer 1 (Outer Envelope)
        inner_body = crypto.decrypt_outer_envelope(envelope.model_dump(), SECRET_KEY)
        if not inner_body:
            print("[AUDIT] Layer 1 Decryption FAILED")
            return JSONResponse(status_code=400, content={"status": "error", "message": "Outer decryption failed or invalid signature"})

        print(f"[AUDIT] Layer 1 Body: {inner_body}")

        # 2. Extract fields from decrypted body
        username = inner_body.get('username')
        encrypted_payload = inner_body.get('payload')
        iv_base64 = inner_body.get('iv')
        t_from_client = inner_body.get('T')

        if not all([username, encrypted_payload, iv_base64, t_from_client is not None]):
            print("[AUDIT] Missing fields in Layer 1 body")
            return JSONResponse(status_code=400, content={"status": "error", "message": "Missing required payment fields"})

        # Security: Verify that the username in the payload matches the token
        if username != username_from_token:
            print(f"[AUDIT] Security Conflict: payload user {username} != token user {username_from_token}")
            return JSONResponse(status_code=403, content={"status": "error", "message": "Forbidden: Token mismatch"})

        # 3. Fetch user profile
        user_profile = get_user_profile(username)
        if not user_profile:
            print(f"[AUDIT] User profile NOT FOUND: {username}")
            return JSONResponse(status_code=404, content={"status": "error", "message": "User not found"})

        # 4. Decrypt Layer 2 (Inner Transaction Security)
        decrypted_data = crypto.decrypt_data(
            encrypted_payload,
            iv_base64,
            user_profile['password_key_k2'],
            user_profile['fingerprint_bp'],
            t_from_client
        )

        if not decrypted_data:
            print("[AUDIT] Layer 2 Decryption FAILED")
            return JSONResponse(status_code=401, content={"status": "error", "message": "Decryption failed or invalid key parameters"})

        print(f"[AUDIT] Layer 2 Data: {decrypted_data}")

        message_m = decrypted_data['M']  # "Merchant:username|Amt:amount"
        f1_from_user = decrypted_data['F1']

        # 5. Integrity check (HMAC verification)
        f2_generated = crypto.generate_hmac(user_profile['hmac_key_k1'], message_m)

        if f1_from_user != f2_generated:
            print(f"[AUDIT] HMAC Mismatch: client={f1_from_user}, server={f2_generated}")
            return JSONResponse(status_code=403, content={"status": "error", "message": "Data integrity compromised (HMAC mismatch)"})

        # 6. Replay Protection
        server_t = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        print(f"[AUDIT] Replay Check: server_t={server_t}, client_t={t_from_client}, last_t={user_profile.get('last_t')}")

        if abs(server_t - t_from_client) > 180:
            print("[AUDIT] REJECTED: Time drift > 180s")
            return JSONResponse(status_code=403, content={"status": "error", "message": "Transaction expired (Time out of sync)"})

        if t_from_client <= user_profile.get('last_t', 0):
            print("[AUDIT] REJECTED: Replay sequence detected")
            return JSONResponse(status_code=403, content={"status": "error", "message": "Replay attack detected (Invalid timestamp sequence)"})

        # 7. Extract merchant and amount from transaction message M
        try:
            # Expected M format: "Merchant:017XXXXXXXX|Amt:100.0"
            parts = message_m.split('|')
            merchant_username = parts[0].split(':')[1]
            amount = float(parts[1].split(':')[1])
            print(f"[AUDIT] Payment Details: Merchant={merchant_username}, Amount={amount}")
        except Exception as e:
            print(f"[AUDIT] Message parsing failed: {e}")
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid message format"})

        # 8. Execute payment via Atomic Stored Procedure
        try:
            rpc_params = {
                'p_sender_username': username,
                'p_merchant_username': merchant_username,
                'p_amount': float(amount),
                'p_timestamp': int(t_from_client),
                'p_reference': f"Merchant Payment to {merchant_username}"
            }
            print(f"[AUDIT] Executing RPC: process_merchant_payment_secure with params: {rpc_params}")

            rpc_response = supabase.rpc('process_merchant_payment_secure', rpc_params).execute()

            if not rpc_response.data:
                print("[AUDIT] RPC returned EMPTY data")
                return JSONResponse(status_code=500, content={"status": "error", "message": "Database transaction failed"})

            result = rpc_response.data
            print(f"[AUDIT] RPC Result: {result}")

            if result['status'] == 'success':
                response_data = {
                    "status": "success",
                    "message": f"Payment of {amount} to {merchant_username} successful",
                    "new_balance": result['new_balance'],
                    "new_t": t_from_client
                }
                print("[AUDIT] Success response generated")
                return crypto.encrypt_outer_envelope(response_data, SECRET_KEY)
            else:
                print(f"[AUDIT] Business logic rejection: {result['message']}")
                return JSONResponse(status_code=400, content={"status": "error", "message": result['message']})

        except Exception as rpc_err:
            print(f"[AUDIT] RPC Exception: {rpc_err}")
            traceback.print_exc()
            return JSONResponse(status_code=500, content={"status": "error", "message": "Atomic transaction error", "traceback": traceback.format_exc()})

    except Exception as e:
        print(f"[AUDIT] CRITICAL ROUTE EXCEPTION: {e}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error", "traceback": traceback.format_exc()})

# ========================================
# Static file serving and catch-all for SPA
# ========================================

# Serve static files from 'dist'
if os.path.exists("dist"):
    # First, mount assets
    if os.path.exists("dist/assets"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/{path_name:path}")
async def catch_all(path_name: str):
    """Serve static files or index.html for SPA routing"""
    if path_name == "":
        index_path = os.path.join("dist", "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # Check if the requested path is a file in dist
    file_path = os.path.join("dist", path_name)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA
    index_path = os.path.join("dist", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(status_code=404, content={"status": "error", "message": "Not Found"})

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run(app, host='0.0.0.0', port=port)
