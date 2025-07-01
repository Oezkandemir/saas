"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Users, UserPlus, Mail, MoreHorizontal, Trash2, Crown, Shield, User, Send, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["MEMBER", "ADMIN"], {
    required_error: "Please select a role",
  }),
});

type InviteValues = z.infer<typeof inviteSchema>;

interface TeamMember {
  id: string;
  role: string;
  created_at: string;
  user_id: string;
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMembersManagementProps {
  team: Team;
  members: TeamMember[];
  invitations: TeamInvitation[];
  userRole: string;
  currentUserId: string;
}

export function TeamMembersManagement({ team, members, invitations, userRole, currentUserId }: TeamMembersManagementProps) {
  const router = useRouter();
  const t = useTranslations("Teams");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onInvite = async (data: InviteValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        throw new Error(error.error || error.message || "Failed to send invitation");
      }

      toast.success(`User ${data.email} has been added to the team and invitation email sent`);
      form.reset();
      setIsInviteDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove member");
      }

      toast.success(`${memberName} has been removed from the team`);
      setIsRemoveDialogOpen(false);
      setSelectedMember(null);
      router.refresh();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  const changeRole = async (memberId: string, newRole: string, memberName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update role");
      }

      toast.success(`${memberName}&apos;s role has been updated to ${newRole}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string, email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend invitation");
      }

      toast.success(`Invitation resent to ${email}`);
      router.refresh();
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel invitation");
      }

      toast.success(`Invitation to ${email} has been cancelled`);
      router.refresh();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4" />;
      case "ADMIN":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  const canManageMembers = userRole === "OWNER" || userRole === "ADMIN";
  const canRemoveMember = (member: TeamMember) => {
    if (member.user_id === currentUserId) return false; // Can&apos;t remove yourself
    if (userRole === "OWNER") return true;
    if (userRole === "ADMIN" && member.role !== "OWNER") return true;
    return false;
  };

  const canChangeRole = (member: TeamMember) => {
    if (member.user_id === currentUserId) return false; // Can&apos;t change your own role
    if (userRole === "OWNER") return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage team members and their roles
                </CardDescription>
              </div>
            </div>
            {canManageMembers && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join {team.name}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                {userRole === "OWNER" && (
                                  <SelectItem value="ADMIN">Administrator</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {field.value === "ADMIN" 
                                ? "Administrators can manage team settings and invite members."
                                : "Members can view team content and participate in projects."
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isLoading}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Invitation
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations ({invitations.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4">
              {members.length === 0 ? (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    No team members found.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {canManageMembers && <TableHead className="w-[100px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {member.users.avatar_url ? (
                                  <AvatarImage src={member.users.avatar_url} alt={member.users.name} />
                                ) : (
                                  <AvatarFallback>
                                    {member.users.name?.substring(0, 2).toUpperCase() || "?"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.users.name}</div>
                                <div className="text-sm text-muted-foreground">{member.users.email}</div>
                              </div>
                              {member.user_id === currentUserId && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                          </TableCell>
                          {canManageMembers && (
                            <TableCell>
                              {(canRemoveMember(member) || canChangeRole(member)) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    
                                    {canChangeRole(member) && member.role !== "OWNER" && (
                                      <>
                                        {member.role === "MEMBER" && (
                                          <DropdownMenuItem
                                            onClick={() => changeRole(member.id, "ADMIN", member.users.name)}
                                            disabled={isLoading}
                                          >
                                            <Shield className="mr-2 h-4 w-4" />
                                            Make Admin
                                          </DropdownMenuItem>
                                        )}
                                        {member.role === "ADMIN" && (
                                          <DropdownMenuItem
                                            onClick={() => changeRole(member.id, "MEMBER", member.users.name)}
                                            disabled={isLoading}
                                          >
                                            <User className="mr-2 h-4 w-4" />
                                            Make Member
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    
                                    {canRemoveMember(member) && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedMember(member);
                                          setIsRemoveDialogOpen(true);
                                        }}
                                        disabled={isLoading}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove Member
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="invitations" className="space-y-4">
              {invitations.length === 0 ? (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    No pending invitations.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Expires</TableHead>
                        {canManageMembers && <TableHead className="w-[100px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(invitation.role)} className="gap-1">
                              {getRoleIcon(invitation.role)}
                              {invitation.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                          </TableCell>
                          {canManageMembers && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => resendInvitation(invitation.id, invitation.email)}
                                    disabled={isLoading}
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Resend
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => cancelInvitation(invitation.id, invitation.email)}
                                    disabled={isLoading}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.users.name} from this team?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMember && removeMember(selectedMember.id, selectedMember.users.name)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 