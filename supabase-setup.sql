-- ============================================================
-- Claire — Supabase setup SQL
-- Run each section once in Dashboard > SQL Editor > New query
-- ============================================================

-- ── 1. Transactions ──────────────────────────────────────────
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('Ingreso', 'Egreso')) NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  responsible TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
ON transactions FOR ALL
USING (auth.uid() = user_id);


-- ── 2. Profiles ───────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '#6366f1'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all profiles (needed for partner info)
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can upsert own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_color)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    '#6366f1'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 3. Savings Goals ─────────────────────────────────────────
CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Both users can see and manage all savings goals (shared)
CREATE POLICY "Authenticated users can manage savings goals"
ON savings_goals FOR ALL
USING (auth.role() = 'authenticated');


-- ── 4. Monthly Notes ─────────────────────────────────────────
CREATE TABLE monthly_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,           -- format: YYYY-MM
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, month)        -- required for upsert conflict resolution
);

ALTER TABLE monthly_notes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all notes (to see partner's note)
CREATE POLICY "Authenticated users can read monthly notes"
ON monthly_notes FOR SELECT
USING (auth.role() = 'authenticated');

-- Users can only insert/update their own notes
CREATE POLICY "Users can manage own monthly notes"
ON monthly_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly notes"
ON monthly_notes FOR UPDATE USING (auth.uid() = user_id);


-- ── 5. Profile migrations (run after initial setup) ──────────
-- Add theme column (if not yet present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- Add avatar_url column (if not yet present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add language column for cross-device language sync
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es';
