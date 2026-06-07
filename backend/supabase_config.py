"""
Supabase Configuration
Store these securely in environment variables in production
"""

import os

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# For server-side operations, use the service role key (not included here for security)
# SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
