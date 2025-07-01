# Teams Migration

## Problem
The teams feature was showing a `NEXT_REDIRECT` error because the required database tables were not created. This migration creates all necessary tables and functions for the Teams feature.

## Solution
Apply the `teams-migration.sql` file to your Supabase database.

## Tables Created
- `teams` - Main teams table with basic information
- `team_members` - Junction table for team membership with roles
- `team_invitations` - Table for managing team invitations
- `team_projects` - Table for team projects (optional feature)
- `team_activities` - Audit log for team activities

## Functions Created
- `generate_team_slug(team_name)` - Generates unique URL-friendly slugs
- `create_team(name, description, logo_url, owner_id)` - Creates team with owner
- `add_team_member(team_id, user_id, role, inviter_id)` - Adds members with permission checks

## How to Apply

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `teams-migration.sql`
4. Run the query

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed and configured
supabase db push --file migrations/teams-migration.sql
```

### Option 3: Manual SQL execution
Connect to your PostgreSQL database and execute the migration file directly.

## Verification
After applying the migration, you can verify by:

1. Checking that the tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('teams', 'team_members', 'team_invitations', 'team_projects', 'team_activities');
```

2. Creating a test team:
```sql
SELECT create_team('Test Team', 'A test team for verification');
```

## Security
This migration includes Row Level Security (RLS) policies to ensure:
- Users can only see teams they are members of
- Only owners and admins can manage team settings
- Only owners can delete teams
- Proper permission checks for all operations

## Next Steps
After applying this migration, the Teams feature should work correctly without the `NEXT_REDIRECT` error. 