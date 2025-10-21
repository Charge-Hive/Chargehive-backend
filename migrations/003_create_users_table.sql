-- Migration: Create users table
-- Database: User Supabase
-- Created: 2025-10-11

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255),
  phone VARCHAR(255),
  profile_image VARCHAR(255),
  is_active VARCHAR(255),
  wallet_address VARCHAR(255),
  private_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: RLS is disabled because authentication is handled by Node.js backend with JWT
-- The backend service uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- Security is enforced at the API layer via middleware