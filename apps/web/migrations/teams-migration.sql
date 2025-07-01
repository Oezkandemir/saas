-- Teams Migration
-- This migration creates all necessary tables and functions for the Teams feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    billing_email VARCHAR(320),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT teams_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT teams_slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0),
    CONSTRAINT teams_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(team_id, user_id),
    CONSTRAINT team_members_role_check CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(team_id, email),
    CONSTRAINT team_invitations_role_check CHECK (role IN ('ADMIN', 'MEMBER')),
    CONSTRAINT team_invitations_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'))
);

-- Team projects table
CREATE TABLE IF NOT EXISTS team_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT team_projects_status_check CHECK (status IN ('active', 'archived', 'deleted'))
);

-- Team activities table (for audit log)
CREATE TABLE IF NOT EXISTS team_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add default_team_id to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'default_team_id') THEN
        ALTER TABLE users ADD COLUMN default_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_team_id ON team_activities(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_team_slug(team_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := LOWER(REGEXP_REPLACE(TRIM(team_name), '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove leading/trailing hyphens
    base_slug := TRIM(base_slug, '-');
    -- Limit length
    base_slug := LEFT(base_slug, 80);
    
    final_slug := base_slug;
    
    -- Check if slug exists and append counter if needed
    WHILE EXISTS (SELECT 1 FROM teams WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to create a team with owner
CREATE OR REPLACE FUNCTION create_team(
    name TEXT,
    description TEXT DEFAULT NULL,
    logo_url TEXT DEFAULT NULL,
    owner_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    new_team_id UUID;
    team_slug TEXT;
BEGIN
    -- Validate input
    IF name IS NULL OR LENGTH(TRIM(name)) = 0 THEN
        RAISE EXCEPTION 'Team name cannot be empty';
    END IF;
    
    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'Owner ID is required';
    END IF;
    
    -- Generate unique slug
    team_slug := generate_team_slug(name);
    
    -- Create team
    INSERT INTO teams (name, slug, description, logo_url)
    VALUES (name, team_slug, description, logo_url)
    RETURNING id INTO new_team_id;
    
    -- Add owner as team member
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (new_team_id, owner_id, 'OWNER');
    
    -- Set as default team if user doesn't have one
    UPDATE users 
    SET default_team_id = new_team_id 
    WHERE id = owner_id AND default_team_id IS NULL;
    
    -- Log activity
    INSERT INTO team_activities (team_id, user_id, action, details)
    VALUES (new_team_id, owner_id, 'team_created', jsonb_build_object('team_name', name));
    
    RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add member to team
CREATE OR REPLACE FUNCTION add_team_member(
    team_id UUID,
    user_id UUID,
    member_role TEXT DEFAULT 'MEMBER',
    inviter_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    inviter_member_role TEXT;
BEGIN
    -- Check if inviter has permission
    SELECT role INTO inviter_member_role 
    FROM team_members 
    WHERE team_id = add_team_member.team_id AND user_id = inviter_id;
    
    IF inviter_member_role IS NULL THEN
        RAISE EXCEPTION 'You are not a member of this team';
    END IF;
    
    IF inviter_member_role NOT IN ('OWNER', 'ADMIN') THEN
        RAISE EXCEPTION 'You do not have permission to add members';
    END IF;
    
    -- Add member
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (team_id, user_id, member_role)
    ON CONFLICT (team_id, user_id) DO UPDATE SET role = member_role;
    
    -- Log activity
    INSERT INTO team_activities (team_id, user_id, action, details)
    VALUES (team_id, inviter_id, 'member_added', 
            jsonb_build_object('added_user_id', user_id, 'role', member_role));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_projects_updated_at BEFORE UPDATE ON team_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they are members of" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can update teams" ON teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Owners can delete teams" ON teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
            AND team_members.role = 'OWNER'
        )
    );

-- Team members policies
CREATE POLICY "Team members can view other team members" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = team_members.team_id 
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = team_members.team_id 
            AND tm.user_id = auth.uid()
            AND tm.role IN ('OWNER', 'ADMIN')
        )
    );

-- Team invitations policies
CREATE POLICY "Team members can view invitations" ON team_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_invitations.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage invitations" ON team_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_invitations.team_id 
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('OWNER', 'ADMIN')
        )
    );

-- Team projects policies
CREATE POLICY "Team members can view team projects" ON team_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_projects.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage team projects" ON team_projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_projects.team_id 
            AND team_members.user_id = auth.uid()
            AND team_members.role IN ('OWNER', 'ADMIN')
        )
    );

-- Team activities policies  
CREATE POLICY "Team members can view team activities" ON team_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_activities.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "All team members can insert activities" ON team_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = team_activities.team_id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_invitations TO authenticated;
GRANT ALL ON team_projects TO authenticated;
GRANT ALL ON team_activities TO authenticated; 