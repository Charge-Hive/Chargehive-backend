-- Migration: Create payments table and update sessions table
-- Database: ChargeHive (Supabase)
-- Created: 2025-10-26

-- Create payment_method enum type
CREATE TYPE payment_method_enum AS ENUM ('card', 'flow_token');

-- Create payment_status enum type
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create session_payment_status enum type
CREATE TYPE session_payment_status_enum AS ENUM ('unpaid', 'paid', 'refunded');

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  payment_method payment_method_enum NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  flow_token_amount DECIMAL(18, 8) NULL,
  flow_token_price_usd DECIMAL(10, 6) NULL,
  transaction_hash TEXT NULL,
  sender_wallet_address TEXT NULL,
  receiver_wallet_address TEXT NULL,
  status payment_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure amount is positive
  CONSTRAINT positive_amount_usd CHECK (amount_usd > 0),

  -- Ensure flow_token_amount is positive if provided
  CONSTRAINT positive_flow_amount CHECK (flow_token_amount IS NULL OR flow_token_amount > 0),

  -- Ensure flow_token_price is positive if provided
  CONSTRAINT positive_flow_price CHECK (flow_token_price_usd IS NULL OR flow_token_price_usd > 0),

  -- If payment method is flow_token, flow fields must be populated
  CONSTRAINT flow_token_fields_required CHECK (
    (payment_method = 'flow_token' AND flow_token_amount IS NOT NULL AND flow_token_price_usd IS NOT NULL)
    OR payment_method = 'card'
  )
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_hash ON payments(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Add payment columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status session_payment_status_enum NOT NULL DEFAULT 'unpaid';

-- Create index on sessions payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_sessions_payment_status ON sessions(payment_status);

-- Create trigger to update updated_at timestamp on payments table
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Note: RLS is disabled because authentication is handled by Node.js backend with JWT
-- The backend service uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- Security is enforced at the API layer via middleware
