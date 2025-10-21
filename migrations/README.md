# Database Migrations

This directory contains SQL migration files for setting up the database schema.

## Structure

```
migrations/
├── users/          # Migrations for User Supabase database
│   └── 001_create_users_table.sql
├── providers/      # Migrations for Provider Supabase database
│   └── 001_create_providers_table.sql
└── README.md
```

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. **For Users Database:**
   - Go to your User Supabase project dashboard
   - Navigate to **SQL Editor**
   - Click **New Query**
   - Copy and paste content from `migrations/users/001_create_users_table.sql`
   - Click **Run** to execute

2. **For Providers Database:**
   - Go to your Provider Supabase project dashboard
   - Navigate to **SQL Editor**
   - Click **New Query**
   - Copy and paste content from `migrations/providers/001_create_providers_table.sql`
   - Click **Run** to execute

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# For Users database
supabase db execute --file migrations/users/001_create_users_table.sql --project-ref YOUR_USER_PROJECT_REF

# For Providers database
supabase db execute --file migrations/providers/001_create_providers_table.sql --project-ref YOUR_PROVIDER_PROJECT_REF
```

### Option 3: Using psql

```bash
# Connect to User database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-USER-PROJECT-URL]:5432/postgres" -f migrations/users/001_create_users_table.sql

# Connect to Provider database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROVIDER-PROJECT-URL]:5432/postgres" -f migrations/providers/001_create_providers_table.sql
```

## Migration Naming Convention

Migrations follow this pattern: `XXX_description.sql`

- `XXX`: Sequential number (001, 002, 003, etc.)
- `description`: Brief description using snake_case

Example: `001_create_users_table.sql`

## Creating New Migrations

1. Create a new SQL file in the appropriate directory (users/ or providers/)
2. Use the next sequential number
3. Include both UP (create) and DOWN (rollback) logic if needed
4. Add comments explaining the changes
5. Test the migration on a development database first

## Rollback Migrations

To rollback, create a new migration that reverses the changes:

Example: `002_rollback_users_table.sql`

```sql
-- Drop table
DROP TABLE IF EXISTS users CASCADE;
```

## Important Notes

- **Always backup** your database before running migrations in production
- **Test migrations** in development/staging first
- Migrations run in **sequential order** based on filename
- Each migration should be **idempotent** (safe to run multiple times)
- Use `IF NOT EXISTS` and `IF EXISTS` clauses where appropriate
- Document breaking changes in the migration file
