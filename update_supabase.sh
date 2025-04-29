#!/bin/bash

# Create a temporary file with a demo Supabase project
cat > .env.local.new << EOF
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
AUTH_SECRET=$(cat .env.local | grep AUTH_SECRET | cut -d= -f2)

# Database (PostgreSQL)
DATABASE_URL=postgres://postgres:password@localhost:5432/nextjs_saas_db

# Supabase - Using demo project URL
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=your-jwt-secret
EOF

# Replace the existing file
mv .env.local.new .env.local

echo "Updated .env.local with working Supabase demo URL" 