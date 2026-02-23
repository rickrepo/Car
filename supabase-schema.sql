-- DealCheck Canada - Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Create the deals table
CREATE TABLE deals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Vehicle info
  vehicle_year int NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_trim text,

  -- Location
  province text NOT NULL,

  -- Deal type
  deal_type text NOT NULL CHECK (deal_type IN ('quote', 'purchase')),

  -- Core numbers
  msrp numeric NOT NULL,
  selling_price numeric NOT NULL,
  payment_amount numeric NOT NULL,
  payment_frequency text NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'biweekly')),
  term_months int NOT NULL,
  residual_value numeric NOT NULL,
  down_payment numeric DEFAULT 0,
  other_credits numeric DEFAULT 0,
  due_on_delivery numeric DEFAULT 0,

  -- Fees (stored as JSONB array)
  fees jsonb DEFAULT '[]'::jsonb,

  -- Computed values (stored for efficient querying/filtering)
  apr numeric,
  money_factor numeric,
  residual_percent numeric,
  discount_percent numeric,
  one_percent_rule numeric,
  overall_grade text,
  total_junk_fees numeric DEFAULT 0,

  -- Optional metadata
  dealership_name text,
  notes text
);

-- Indexes for common queries
CREATE INDEX idx_deals_created_at ON deals (created_at DESC);
CREATE INDEX idx_deals_vehicle ON deals (vehicle_make, vehicle_model, vehicle_year);
CREATE INDEX idx_deals_province ON deals (province);
CREATE INDEX idx_deals_deal_type ON deals (deal_type);
CREATE INDEX idx_deals_overall_grade ON deals (overall_grade);

-- Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Anyone can read deals
CREATE POLICY "Deals are viewable by everyone"
  ON deals FOR SELECT
  USING (true);

-- Anyone can insert deals (anonymous submissions)
CREATE POLICY "Anyone can submit a deal"
  ON deals FOR INSERT
  WITH CHECK (true);

-- No one can update or delete (admin can via service role)
-- No UPDATE or DELETE policies = blocked by RLS
