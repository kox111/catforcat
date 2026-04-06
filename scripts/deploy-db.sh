#!/bin/bash
set -e

# Check if _prisma_migrations table exists (first deploy vs subsequent)
# If migrations table doesn't exist yet, prisma migrate deploy will create it and run all migrations
# If it exists but has no entries, we need to baseline the existing migrations

echo "Running Prisma migrations..."

# Try to resolve already-applied migrations (will fail silently if already resolved or table doesn't exist)
npx prisma migrate resolve --applied 20260310185543_init 2>/dev/null || true
npx prisma migrate resolve --applied 20260314192158_add_missing_fields 2>/dev/null || true
npx prisma migrate resolve --applied 20260328000000_add_2fa_and_rate_limits 2>/dev/null || true
npx prisma migrate resolve --applied 20260330000000_classroom_mode 2>/dev/null || true
npx prisma migrate resolve --applied 20260402000000_oauth_models 2>/dev/null || true

# Deploy pending migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

echo "Database ready."
