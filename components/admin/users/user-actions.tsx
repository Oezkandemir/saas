"use client";

import { useState } from "react";
import { User } from "./columns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, ShieldAlert, Trash, Unlock, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { toggleUserBanStatus, deleteUser, toggleUserAdminStatus } from "@/actions/admin-user-actions";

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle user ban/unban
  const handleBanUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the server action
      const result = await toggleUserBanStatus(user.id, user.status);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success toast
      toast({
        title: user.status === 'banned' ? 'User Unbanned' : 'User Banned',
        description: `Successfully ${user.status === 'banned' ? 'unbanned' : 'banned'} ${user.email}`,
      });
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      console.error('Error banning/unbanning user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: 'Operation Failed',
        description: `Failed to ${user.status === 'banned' ? 'unban' : 'ban'} user. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowBanDialog(false);
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the server action
      const result = await deleteUser(user.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success toast
      toast({
        title: 'User Deleted',
        description: `Successfully deleted ${user.email}`,
      });
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle toggle admin status
  const handleToggleAdmin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the server action
      const result = await toggleUserAdminStatus(user.id, user.role);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success toast
      toast({
        title: user.role === 'ADMIN' ? 'Admin Rights Removed' : 'Admin Rights Granted',
        description: `Successfully ${user.role === 'ADMIN' ? 'removed admin rights from' : 'granted admin rights to'} ${user.email}`,
      });
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: 'Operation Failed',
        description: `Failed to ${user.role === 'ADMIN' ? 'remove admin rights' : 'grant admin rights'}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowAdminDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Toggle Admin Status Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowAdminDialog(true)}
            className="cursor-pointer"
          >
            {user.role === 'ADMIN' ? (
              <>
                <Shield className="mr-2 h-4 w-4 text-blue-600" />
                <span className="text-blue-600">Remove Admin</span>
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4 text-purple-600" />
                <span className="text-purple-600">Make Admin</span>
              </>
            )}
          </DropdownMenuItem>
          
          {/* Ban/Unban User Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowBanDialog(true)}
            className="cursor-pointer"
          >
            {user.status === 'banned' ? (
              <>
                <Unlock className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Unban User</span>
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 h-4 w-4 text-amber-600" />
                <span className="text-amber-600">Ban User</span>
              </>
            )}
          </DropdownMenuItem>
          
          {/* Delete User Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer"
          >
            <Trash className="mr-2 h-4 w-4 text-red-600" />
            <span className="text-red-600">Delete User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Admin Toggle Confirmation Dialog */}
      <AlertDialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.role === 'ADMIN' ? 'Remove Admin Rights' : 'Grant Admin Rights'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.role === 'ADMIN' 
                ? `This will remove admin privileges from ${user.email}.`
                : `This will grant admin privileges to ${user.email}, giving them full access to the admin panel.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={loading}
              onClick={handleToggleAdmin}
              className={user.role === 'ADMIN' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {loading ? 'Processing...' : user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Ban/Unban Confirmation Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.status === 'banned' ? 'Unban User' : 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.status === 'banned' 
                ? `This will unban ${user.email} and restore their access to the application.`
                : `This will ban ${user.email} and prevent them from accessing the application.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={loading}
              onClick={handleBanUser}
              className={user.status === 'banned' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              {loading ? 'Processing...' : user.status === 'banned' ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user {user.email} and remove all their data from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={loading}
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 