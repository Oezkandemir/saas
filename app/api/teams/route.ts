import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandlerClient } from "@/lib/supabase-route-handler";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const supabase = await getSupabaseRouteHandlerClient();
    const requestData = await request.json();
    const { action, ...data } = requestData;
    
    switch (action) {
      case "create-team": {
        const { name, description, logo_url } = data;
        
        if (!name || typeof name !== "string") {
          return NextResponse.json(
            { error: "Team name is required" },
            { status: 400 }
          );
        }
        
        const { data: newTeamId, error } = await supabase
          .rpc('create_team', { 
            name, 
            description: description || null, 
            logo_url: logo_url || null 
          });
        
        if (error) {
          console.error("Error creating team:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ id: newTeamId });
      }
      
      case "update-team": {
        const { id, name, description, logo_url } = data;
        
        if (!id || !name) {
          return NextResponse.json(
            { error: "Team ID and name are required" },
            { status: 400 }
          );
        }
        
        // Check if user has permission to update this team
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', id)
          .eq('user_id', session.user.id)
          .single();
          
        if (memberError || !memberData || !['OWNER', 'ADMIN'].includes(memberData.role)) {
          return NextResponse.json(
            { error: "You don't have permission to update this team" },
            { status: 403 }
          );
        }
        
        const { data: updatedTeam, error } = await supabase
          .from('teams')
          .update({
            name,
            description: description || null,
            logo_url: logo_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating team:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ team: updatedTeam });
      }
      
      case "delete-team": {
        const { id } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: "Team ID is required" },
            { status: 400 }
          );
        }
        
        // Check if user is owner
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', id)
          .eq('user_id', session.user.id)
          .single();
          
        if (memberError || !memberData || memberData.role !== 'OWNER') {
          return NextResponse.json(
            { error: "Only team owners can delete teams" },
            { status: 403 }
          );
        }
        
        // Delete the team (cascade will handle related records)
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error deleting team:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "set-default-team": {
        const { id } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: "Team ID is required" },
            { status: 400 }
          );
        }
        
        const { data: result, error } = await supabase
          .rpc('set_default_team', { team_id: id });
        
        if (error) {
          console.error("Error setting default team:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in teams API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 