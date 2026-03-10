-- ============================================================
-- GlowLoyalty – Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Users table (customers + staff)
CREATE TABLE IF NOT EXISTS public.users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  phone         TEXT        DEFAULT '',
  password_hash TEXT        NOT NULL,
  role          TEXT        DEFAULT 'customer' CHECK (role IN ('customer', 'staff')),
  points        INTEGER     DEFAULT 0,
  tier          TEXT        DEFAULT 'Bronasta',
  qr_token      TEXT        UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id             BIGSERIAL PRIMARY KEY,
  customer_id    BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  staff_id       BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  service        TEXT    NOT NULL,
  amount         REAL    DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  notes          TEXT    DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email     ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_qr_token  ON public.users(qr_token);
CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON public.visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff    ON public.visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_created  ON public.visits(created_at DESC);

-- Disable RLS (app uses its own JWT auth, not Supabase Auth)
ALTER TABLE public.users  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role (for the publishable key)
GRANT ALL ON public.users  TO anon, authenticated;
GRANT ALL ON public.visits TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq  TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.visits_id_seq TO anon, authenticated;
