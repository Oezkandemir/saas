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
      case "update-role": {
        const { teamId, userId, role } = data;
        
        if (!teamId || !userId || !role) {
          return NextResponse.json(
            { error: "Team ID, user ID, and role are required" },
            { status: 400 }
          );
        }
        
        // Check if the current user has permission to update roles
        const { data: currentUserMember, error: currentUserError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', session.user.id)
          .single();
        
        if (currentUserError || !currentUserMember || !['OWNER', 'ADMIN'].includes(currentUserMember.role)) {
          return NextResponse.json(
            { error: "You don't have permission to update member roles" },
            { status: 403 }
          );
        }
        
        // Get the target member's current role
        const { data: targetMember, error: targetMemberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .single();
        
        if (targetMemberError || !targetMember) {
          return NextResponse.json(
            { error: "Member not found" },
            { status: 404 }
          );
        }
        
        // Prevent non-owners from modifying owner role
        if (
          (targetMember.role === 'OWNER' && currentUserMember.role !== 'OWNER') ||
          (role === 'OWNER' && currentUserMember.role !== 'OWNER')
        ) {
          return NextResponse.json(
            { error: "Only team owners can modify the owner role" },
            { status: 403 }
          );
        }
        
        // Prevent removing the last owner
        if (targetMember.role === 'OWNER' && role !== 'OWNER') {
          // Count how many owners the team has
          const { count, error: countError } = await supabase
            .from('team_members')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .eq('role', 'OWNER');
          
          if (countError || count === null || count <= 1) {
            return NextResponse.json(
              { error: "Cannot remove the last owner of a team" },
              { status: 400 }
            );
          }
        }
        
        // Update the member's role
        const { data: updatedMember, error: updateError } = await supabase
          .from('team_members')
          .update({ role })
          .eq('team_id', teamId)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.error("Error updating member role:", updateError);
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ member: updatedMember });
      }
      
      case "remove-member": {
        const { teamId, userId } = data;
        
        if (!teamId || !userId) {
          return NextResponse.json(
            { error: "Team ID and user ID are required" },
            { status: 400 }
          );
        }
        
        // Check if it's the same user (leaving) or an admin/owner (removing)
        const isSelfRemoval = userId === session.user.id;
        
        if (!isSelfRemoval) {
          // Check if the current user has permission to remove members
          const { data: currentUserMember, error: currentUserError } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', session.user.id)
            .single();
          
          if (currentUserError || !currentUserMember || !['OWNER', 'ADMIN'].includes(currentUserMember.role)) {
            return NextResponse.json(
              { error: "You don't have permission to remove members" },
              { status: 403 }
            );
          }
          
          // Get the target member's current role
          const { data: targetMember, error: targetMemberError } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .single();
          
          if (targetMemberError || !targetMember) {
            return NextResponse.json(
              { error: "Member not found" },
              { status: 404 }
            );
          }
          
          // Admins can't remove owners
          if (targetMember.role === 'OWNER' && currentUserMember.role !== 'OWNER') {
            return NextResponse.json(
              { error: "Only team owners can remove other owners" },
              { status: 403 }
            );
          }
          
          // Prevent removing the last owner
          if (targetMember.role === 'OWNER') {
            // Count how many owners the team has
            const { count, error: countError } = await supabase
              .from('team_members')
              .select('id', { count: 'exact', head: true })
              .eq('team_id', teamId)
              .eq('role', 'OWNER');
            
            if (countError || count === null || count <= 1) {
              return NextResponse.json(
                { error: "Cannot remove the last owner of a team" },
                { status: 400 }
              );
            }
          }
        }
        
        // Remove the member
        const { error: deleteError } = await supabase
          .from('team_members')
          .delete()
          .eq('team_id', teamId)
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error("Error removing team member:", deleteError);
          return NextResponse.json(
            { error: deleteError.message },
            { status: 500 }
          );
        }
        
        // If the user removed themselves from their default team, update their default team
        if (isSelfRemoval) {
          const { data: userData } = await supabase
            .from('users')
            .select('default_team_id')
            .eq('id', session.user.id)
            .single();
          
          if (userData && userData.default_team_id === teamId) {
            // Find another team to set as default
            const { data: otherTeam } = await supabase
              .from('team_members')
              .select('team_id')
              .eq('user_id', session.user.id)
              .limit(1)
              .single();
            
            if (otherTeam) {
              // Set as default
              await supabase.rpc('set_default_team', { team_id: otherTeam.team_id });
            } else {
              // No teams left, clear default
              await supabase
                .from('users')
                .update({ default_team_id: null })
                .eq('id', session.user.id);
            }
          }
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
    console.error("Error in team members API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 