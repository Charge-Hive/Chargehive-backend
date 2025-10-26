-- Migration: Modify payments table to support session creation after payment
-- Database: ChargeHive (Supabase)
-- Created: 2025-10-26
-- Purpose: Allow payment records to exist before session creation for Flow payments

-- 1. Make session_id nullable in payments table
ALTER TABLE payments
  ALTER COLUMN session_id DROP NOT NULL;

-- 2. Add booking details columns to payments table
-- These store the booking intent when payment is initiated (before session exists)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(service_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS from_datetime TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS to_datetime TIMESTAMP WITH TIME ZONE;

-- 3. Add constraint: Either session_id exists OR booking details exist
ALTER TABLE payments
  ADD CONSTRAINT payment_has_session_or_booking CHECK (
    (session_id IS NOT NULL) OR
    (service_id IS NOT NULL AND from_datetime IS NOT NULL AND to_datetime IS NOT NULL)
  );

-- 4. Create index on service_id for payments
CREATE INDEX IF NOT EXISTS idx_payments_service_id ON payments(service_id);

-- Note: This allows the following flow:
-- 1. initiateFlowPayment: Create payment with service_id, from_datetime, to_datetime (session_id = NULL)
-- 2. User sends Flow tokens
-- 3. executeFlowPayment: Create session, then update payment with session_id
