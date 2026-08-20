-- Supabase Table Schema for Portfolio Checkouts / Visits
CREATE TABLE IF NOT EXISTS portfolio_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  action_type TEXT DEFAULT 'PAGE_VISIT',
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  language TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional Row Level Security (RLS) Policy for Public Insert
ALTER TABLE portfolio_checkouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to portfolio_checkouts"
  ON portfolio_checkouts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read to portfolio_checkouts"
  ON portfolio_checkouts
  FOR SELECT
  USING (true);
