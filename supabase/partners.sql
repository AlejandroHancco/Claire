CREATE TABLE partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID REFERENCES auth.users(id),
  user_id_2 UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id_1, user_id_2)
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners can see each other"
ON partners FOR SELECT
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
