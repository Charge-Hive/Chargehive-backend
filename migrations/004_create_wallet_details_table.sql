-- Migration: Create wallet_details table
-- Database: ChargeHive Supabase
-- Created: 2025-10-18

-- Create wallet_details table
CREATE TABLE IF NOT EXISTS wallet_details (
  wallet_address VARCHAR(255) PRIMARY KEY,
  private_key TEXT NOT NULL
);
