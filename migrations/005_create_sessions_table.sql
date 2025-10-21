-- Migration: Create sessions table
-- Database: ChargeHive (Supabase)
-- Created: 2025-10-20

-- Create sessions table for booking parking and charging services
CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
  from_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  to_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure from_datetime is before to_datetime
  CONSTRAINT valid_datetime_range CHECK (from_datetime < to_datetime)
);

-- Create index for faster queries on user sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Create index for faster queries on provider sessions
CREATE INDEX IF NOT EXISTS idx_sessions_provider_id ON sessions(provider_id);

-- Create index for faster queries on service sessions
CREATE INDEX IF NOT EXISTS idx_sessions_service_id ON sessions(service_id);

-- Create index for datetime range queries (used for overlap checking)
CREATE INDEX IF NOT EXISTS idx_sessions_datetime ON sessions(from_datetime, to_datetime);

-- Note: RLS is disabled because authentication is handled by Node.js backend with JWT
-- The backend service uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- Security is enforced at the API layer via middleware
