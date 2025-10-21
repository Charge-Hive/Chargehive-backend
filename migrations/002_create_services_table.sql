-- Migration: Create services table
-- Database: ChargeHive (Supabase)
-- Created: 2025-01-16

-- Create services table for parking spots and EV charging stations
CREATE TABLE IF NOT EXISTS services (
  service_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_type VARCHAR(255),
  status VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  postal_code VARCHAR(255),
  country VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255),
  image1 VARCHAR(255),
  image2 VARCHAR(255),
  image3 VARCHAR(255),
  description TEXT,
  hourly_rate VARCHAR(255) DEFAULT '10',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: RLS is disabled because authentication is handled by Node.js backend with JWT
-- The backend service uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- Security is enforced at the API layer via middleware
