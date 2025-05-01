"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClockIcon, MoreHorizontal, ShieldCheck, UserPlus, UserX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: TeamRole;
  joinedAt: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  expiresAt: string;
}

export interface TeamMembersProps {
  members: TeamMember[];
  invitations: TeamInvitation[];
  teamId: string;
  userRole: TeamRole;
}

export function TeamMembers({ members, invitations, teamId, userRole }: TeamMembersProps) {
  const t = useTranslations('Teams');
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MEMBER' as TeamRole });
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmRoleChangeOpen, setConfirmRoleChangeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);

  const canManageMembers = ['OWNER', 'ADMIN'].includes(userRole);
  const canManageOwners = userRole === 'OWNER';

  const resetInviteForm = () => {
    setInviteForm({ email: '', role: 'MEMBER' });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.email.trim()) {
      toast.error(t('teamMembers.inviteErrors.emailRequired'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/teams/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invite',
          teamId,
          email: inviteForm.email,
          role: inviteForm.role,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('teamMembers.inviteErrors.default'));
      }
      
      toast.success(t('teamMembers.inviteSuccess', { email: inviteForm.email }));
      setInviteDialogOpen(false);
      resetInviteForm();
      router.refresh();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error instanceof Error ? error.message : t('teamMembers.inviteErrors.default'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/teams/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove-member',
          teamId,
          userId: selectedMember.userId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('teamMembers.removeErrors.default'));
      }
      
      toast.success(t('teamMembers.removeSuccess', { name: selectedMember.name }));
      setConfirmRemoveOpen(false);
      setSelectedMember(null);
      router.refresh();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : t('teamMembers.removeErrors.default'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !selectedRole) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/teams/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-role',
          teamId,
          userId: selectedMember.userId,
          role: selectedRole,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('teamMembers.roleErrors.default'));
      }
      
      toast.success(t('teamMembers.roleSuccess', { 
        name: selectedMember.name,
        role: t(`roles.${selectedRole.toLowerCase()}`)
      }));
      setConfirmRoleChangeOpen(false);
      setSelectedMember(null);
      setSelectedRole(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : t('teamMembers.roleErrors.default'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/teams/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: invitationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('teamMembers.inviteCancelErrors.default'));
      }
      
      toast.success(t('teamMembers.inviteCancelSuccess'));
      router.refresh();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(error instanceof Error ? error.message : t('teamMembers.inviteCancelErrors.default'));
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/teams/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
          id: invitationId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('teamMembers.inviteResendErrors.default'));
      }
      
      toast.success(t('teamMembers.inviteResendSuccess'));
      router.refresh();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error instanceof Error ? error.message : t('teamMembers.inviteResendErrors.default'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('teamMembers.title')}</h2>
        {canManageMembers && (
          <Button 
            size="sm" 
            onClick={() => {
              resetInviteForm();
              setInviteDialogOpen(true);
            }}
          >
            <UserPlus className="mr-2 size-4" />
            {t('teamMembers.invite')}
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            {t('teamMembers.tabs.members')} ({members.length})
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="invitations">
              {t('teamMembers.tabs.invitations')} ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('teamMembers.membersTitle')}</CardTitle>
              <CardDescription>
                {t('teamMembers.membersDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('teamMembers.memberTable.name')}</TableHead>
                    <TableHead>{t('teamMembers.memberTable.email')}</TableHead>
                    <TableHead>{t('teamMembers.memberTable.role')}</TableHead>
                    <TableHead>{t('teamMembers.memberTable.joined')}</TableHead>
                    {canManageMembers && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            {member.avatarUrl ? (
                              <AvatarImage src={member.avatarUrl} alt={member.name} />
                            ) : (
                              <AvatarFallback>
                                {member.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                          {t(`roles.${member.role.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(member.joinedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">{t('teamMembers.memberTable.actions')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(canManageOwners || member.role !== 'OWNER') && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setConfirmRoleChangeOpen(true);
                                    }}
                                    disabled={!canManageOwners && member.role === 'OWNER'}
                                  >
                                    <ShieldCheck className="mr-2 size-4" />
                                    {t('teamMembers.changeRole')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setConfirmRemoveOpen(true);
                                }}
                                disabled={!canManageOwners && member.role === 'OWNER'}
                              >
                                <UserX className="mr-2 size-4" />
                                {t('teamMembers.remove')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {canManageMembers && (
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('teamMembers.invitationsTitle')}</CardTitle>
                <CardDescription>
                  {t('teamMembers.invitationsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {t('teamMembers.noInvitations')}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('teamMembers.invitationTable.email')}</TableHead>
                        <TableHead>{t('teamMembers.invitationTable.role')}</TableHead>
                        <TableHead>{t('teamMembers.invitationTable.expires')}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {t(`roles.${invitation.role.toLowerCase()}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <ClockIcon className="mr-2 size-4 text-muted-foreground" />
                              {formatDistanceToNow(new Date(invitation.expiresAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">{t('teamMembers.invitationTable.actions')}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(invitation.id)}
                                >
                                  {t('teamMembers.resend')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                >
                                  {t('teamMembers.cancel')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('teamMembers.inviteDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('teamMembers.inviteDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="required">
                  {t('teamMembers.inviteDialogEmailLabel')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">
                  {t('teamMembers.inviteDialogRoleLabel')}
                </Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value: TeamRole) => setInviteForm({ ...inviteForm, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder={t('teamMembers.inviteDialogRolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {canManageOwners && (
                      <SelectItem value="OWNER">{t('roles.owner')}</SelectItem>
                    )}
                    <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                    <SelectItem value="MEMBER">{t('roles.member')}</SelectItem>
                    <SelectItem value="GUEST">{t('roles.guest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t('teamMembers.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !inviteForm.email}>
                {isSubmitting ? t('teamMembers.sending') : t('teamMembers.send')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Remove Member Dialog */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('teamMembers.removeDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('teamMembers.removeDialogDescription', {
                name: selectedMember?.name || '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
              disabled={isSubmitting}
            >
              {t('teamMembers.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('teamMembers.removing') : t('teamMembers.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog open={confirmRoleChangeOpen} onOpenChange={setConfirmRoleChangeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('teamMembers.changeRoleDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('teamMembers.changeRoleDialogDescription', {
                name: selectedMember?.name || '',
                role: selectedMember ? t(`roles.${selectedMember.role.toLowerCase()}`) : '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-role">
              {t('teamMembers.changeRoleDialogLabel')}
            </Label>
            <Select
              value={selectedRole || undefined}
              onValueChange={(value: TeamRole) => setSelectedRole(value)}
            >
              <SelectTrigger id="new-role">
                <SelectValue placeholder={t('teamMembers.changeRoleDialogPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {canManageOwners && (
                  <SelectItem value="OWNER">{t('roles.owner')}</SelectItem>
                )}
                <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                <SelectItem value="MEMBER">{t('roles.member')}</SelectItem>
                <SelectItem value="GUEST">{t('roles.guest')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRoleChangeOpen(false)}
              disabled={isSubmitting}
            >
              {t('teamMembers.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleRoleChange}
              disabled={isSubmitting || !selectedRole}
            >
              {isSubmitting ? t('teamMembers.updating') : t('teamMembers.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 