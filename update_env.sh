#!/bin/bash

# Generate a random string for AUTH_SECRET
AUTH_SECRET=$(openssl rand -base64 32)

# Create a temporary file
cat > .env.local.new << EOF
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
AUTH_SECRET=${AUTH_SECRET}

# Database (PostgreSQL)
DATABASE_URL=postgres://postgres:password@localhost:5432/nextjs_saas_db

# Supabase - Replace placeholder with actual values
NEXT_PUBLIC_SUPABASE_URL=https://rvhssojlbmlxpkaqcvpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
EOF

# Replace the existing file
mv .env.local.new .env.local

echo "Updated .env.local with a secure AUTH_SECRET" 