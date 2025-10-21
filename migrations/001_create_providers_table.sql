-- Migration: Create providers table
-- Database: ChargeHive (Supabase)
-- Created: 2025-10-11

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  profile_image VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  postal_code VARCHAR(255),
  country VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255),
  is_active VARCHAR(255),
  is_verified VARCHAR(255),
  rating VARCHAR(255),
  total_bookings VARCHAR(255),
  wallet_address VARCHAR(255),
  private_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: RLS is disabled because authentication is handled by Node.js backend with JWT
-- The backend service uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- Security is enforced at the API layer via middleware
