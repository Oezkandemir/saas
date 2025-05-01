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
      case "invite": {
        const { teamId, email, role = 'MEMBER' } = data;
        
        if (!teamId || !email) {
          return NextResponse.json(
            { error: "Team ID and email are required" },
            { status: 400 }
          );
        }
        
        const { data: invitationId, error } = await supabase
          .rpc('invite_to_team', { 
            team_id: teamId, 
            email, 
            role 
          });
        
        if (error) {
          console.error("Error inviting user to team:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ id: invitationId });
      }
      
      case "accept": {
        const { token } = data;
        
        if (!token) {
          return NextResponse.json(
            { error: "Invitation token is required" },
            { status: 400 }
          );
        }
        
        const { data: result, error } = await supabase
          .rpc('accept_team_invitation', { token });
        
        if (error) {
          console.error("Error accepting invitation:", error);
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "resend": {
        const { id } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: "Invitation ID is required" },
            { status: 400 }
          );
        }
        
        // Get the invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (invitationError || !invitation) {
          return NextResponse.json(
            { error: "Invitation not found" },
            { status: 404 }
          );
        }
        
        // Check if user has permission to manage invitations
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', invitation.team_id)
          .eq('user_id', session.user.id)
          .single();
          
        if (memberError || !memberData || !['OWNER', 'ADMIN'].includes(memberData.role)) {
          return NextResponse.json(
            { error: "You don't have permission to manage invitations" },
            { status: 403 }
          );
        }
        
        // Update the invitation expiry date to extend it by 7 days
        const { error: updateError } = await supabase
          .from('team_invitations')
          .update({
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', id);
        
        if (updateError) {
          console.error("Error resending invitation:", updateError);
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      case "delete": {
        const { id } = data;
        
        if (!id) {
          return NextResponse.json(
            { error: "Invitation ID is required" },
            { status: 400 }
          );
        }
        
        // Get the invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from('team_invitations')
          .select('team_id')
          .eq('id', id)
          .single();
        
        if (invitationError || !invitation) {
          return NextResponse.json(
            { error: "Invitation not found" },
            { status: 404 }
          );
        }
        
        // Check if user has permission to manage invitations
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', invitation.team_id)
          .eq('user_id', session.user.id)
          .single();
          
        if (memberError || !memberData || !['OWNER', 'ADMIN'].includes(memberData.role)) {
          return NextResponse.json(
            { error: "You don't have permission to manage invitations" },
            { status: 403 }
          );
        }
        
        // Delete the invitation
        const { error } = await supabase
          .from('team_invitations')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error("Error deleting invitation:", error);
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
    console.error("Error in team invitations API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 