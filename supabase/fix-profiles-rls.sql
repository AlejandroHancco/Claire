-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- 1. Add theme column to profiles (if not already present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';

-- 2. Drop any existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;

-- 3. Add policy: each user can read their own profile AND their partner's profile
CREATE POLICY "Users can read own and partner profiles"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM partners
    WHERE (user_id_1 = auth.uid() AND user_id_2 = id)
       OR (user_id_2 = auth.uid() AND user_id_1 = id)
  )
);

-- 4. Make sure update policy exists for own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Insert policy (for profile seeding)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
