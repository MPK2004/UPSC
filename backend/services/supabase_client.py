"""
Service-role Supabase client for the ingestion worker.

This uses SUPABASE_SERVICE_ROLE_KEY, which bypasses Row Level Security
entirely. It must only ever run server-side (GitHub Actions / local runs of
the pipeline) and must never be shipped to the browser — the frontend keeps
using the anon key via frontend/src/utils/supabaseClient.ts.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
        "(as env vars or in a .env file) to run the ingestion pipeline."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
