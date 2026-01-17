-- Loyalty Program Tables
-- Phone-number based punch card system

-- Loyalty members table
CREATE TABLE loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,           -- Normalized: "5551234567" (digits only)
  name TEXT NOT NULL,
  email TEXT,                           -- Optional email for future communications
  punches INTEGER DEFAULT 0 CHECK (punches >= 0 AND punches <= 9),  -- Current punch count (0-9)
  total_punches INTEGER DEFAULT 0 CHECK (total_punches >= 0),       -- Lifetime punches earned
  total_redeemed INTEGER DEFAULT 0 CHECK (total_redeemed >= 0),     -- Lifetime free sno cones
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW()
);

-- Punch history table (for stats/audit trail)
CREATE TABLE loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES loyalty_members(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('punch', 'redeem', 'adjustment')),
  punch_count INTEGER,                  -- How many punches added (positive) or adjusted
  note TEXT,                            -- Optional note for adjustments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_loyalty_members_phone ON loyalty_members(phone);
CREATE INDEX idx_loyalty_members_name ON loyalty_members(name);
CREATE INDEX idx_loyalty_members_last_visit ON loyalty_members(last_visit DESC);
CREATE INDEX idx_loyalty_members_total_punches ON loyalty_members(total_punches DESC);
CREATE INDEX idx_loyalty_history_member_id ON loyalty_history(member_id);
CREATE INDEX idx_loyalty_history_created_at ON loyalty_history(created_at DESC);

-- Enable RLS
ALTER TABLE loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users (admin) can access loyalty data
CREATE POLICY "Authenticated users can read loyalty_members"
  ON loyalty_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loyalty_members"
  ON loyalty_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loyalty_members"
  ON loyalty_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete loyalty_members"
  ON loyalty_members FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read loyalty_history"
  ON loyalty_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert loyalty_history"
  ON loyalty_history FOR INSERT
  TO authenticated
  WITH CHECK (true);
