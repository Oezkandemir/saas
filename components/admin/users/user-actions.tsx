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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MoreHorizontal, ShieldAlert, Trash, Unlock, Shield, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { toggleUserBanStatus, deleteUser, toggleUserAdminStatus } from "@/actions/admin-user-actions";
import { UserAvatar } from "@/components/shared/user-avatar";

interface UserActionsProps {
  user: User;
  inline?: boolean; // New prop for inline display
}

// Define Tailwind class combinations to avoid lint errors
const flexContainerClasses = "flex flex-wrap justify-center gap-2";
const userInfoContainerClasses = "mb-4 flex items-center gap-3 border-b pb-4";
const buttonContainerClasses = "flex justify-end gap-2";

export function UserActions({ user, inline = false }: UserActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [showBanDrawer, setShowBanDrawer] = useState(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
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
      setShowBanDrawer(false);
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
      setShowDeleteDrawer(false);
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
      setShowAdminDrawer(false);
    }
  };

  // For inline view, show buttons directly instead of dropdown
  if (inline) {
    return (
      <>
        <div className={flexContainerClasses}>
          <Button 
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setShowAdminDrawer(true)}
            className={user.role === 'ADMIN' ? "border-blue-600 text-blue-600" : "border-purple-600 text-purple-600"}
          >
            <Shield className="mr-2 size-4" />
            <span className="hidden sm:inline">{user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}</span>
            <span className="sm:hidden">{user.role === 'ADMIN' ? 'Demote' : 'Promote'}</span>
          </Button>
          
          <Button 
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setShowBanDrawer(true)}
            className={user.status === 'banned' ? "border-green-600 text-green-600" : "border-amber-600 text-amber-600"}
          >
            {user.status === 'banned' ? (
              <>
                <Unlock className="mr-2 size-4" />
                <span className="hidden sm:inline">Unban User</span>
                <span className="sm:hidden">Unban</span>
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 size-4" />
                <span className="hidden sm:inline">Ban User</span>
                <span className="sm:hidden">Ban</span>
              </>
            )}
          </Button>
          
          <Button 
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setShowDeleteDrawer(true)}
            className="border-red-600 text-red-600"
          >
            <Trash className="mr-2 size-4" />
            <span className="hidden sm:inline">Delete User</span>
            <span className="sm:hidden">Delete</span>
          </Button>
        </div>
        
        {/* Confirmation Drawers are shared between both views */}
        {renderConfirmationDrawers()}
      </>
    );
  }

  // Regular dropdown view for desktop table
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Toggle Admin Status Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowAdminDrawer(true)}
            className="cursor-pointer"
          >
            {user.role === 'ADMIN' ? (
              <>
                <Shield className="mr-2 size-4 text-blue-600" />
                <span className="text-blue-600">Remove Admin</span>
              </>
            ) : (
              <>
                <Shield className="mr-2 size-4 text-purple-600" />
                <span className="text-purple-600">Make Admin</span>
              </>
            )}
          </DropdownMenuItem>
          
          {/* Ban/Unban User Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowBanDrawer(true)}
            className="cursor-pointer"
          >
            {user.status === 'banned' ? (
              <>
                <Unlock className="mr-2 size-4 text-green-600" />
                <span className="text-green-600">Unban User</span>
              </>
            ) : (
              <>
                <ShieldAlert className="mr-2 size-4 text-amber-600" />
                <span className="text-amber-600">Ban User</span>
              </>
            )}
          </DropdownMenuItem>
          
          {/* Delete User Option */}
          <DropdownMenuItem 
            disabled={loading}
            onClick={() => setShowDeleteDrawer(true)}
            className="cursor-pointer"
          >
            <Trash className="mr-2 size-4 text-red-600" />
            <span className="text-red-600">Delete User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Shared confirmation drawers */}
      {renderConfirmationDrawers()}
    </>
  );
  
  // Helper function to render shared confirmation drawers
  function renderConfirmationDrawers() {
    return (
      <>
        {/* Admin Toggle Confirmation Drawer */}
        <Drawer open={showAdminDrawer} onOpenChange={setShowAdminDrawer}>
          <DrawerContent>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg font-semibold">
                  {user.role === 'ADMIN' ? 'Remove Admin Rights' : 'Grant Admin Rights'}
                </DrawerTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAdminDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <DrawerDescription className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.role === 'ADMIN' 
                    ? `This will remove admin privileges from ${user.email}.`
                    : `This will grant admin privileges to ${user.email}, giving them full access to the admin panel.`
                  }
                </p>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <div className={buttonContainerClasses}>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button 
                  disabled={loading}
                  onClick={handleToggleAdmin}
                  className={user.role === 'ADMIN' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
                >
                  {loading ? 'Processing...' : user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        
        {/* Ban/Unban Confirmation Drawer */}
        <Drawer open={showBanDrawer} onOpenChange={setShowBanDrawer}>
          <DrawerContent>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg font-semibold">
                  {user.status === 'banned' ? 'Unban User' : 'Ban User'}
                </DrawerTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowBanDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <DrawerDescription className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user.status === 'banned' 
                    ? `This will unban ${user.email} and restore their access to the application.`
                    : `This will ban ${user.email} and prevent them from accessing the application.`
                  }
                </p>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <div className={buttonContainerClasses}>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button 
                  disabled={loading}
                  onClick={handleBanUser}
                  className={user.status === 'banned' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
                >
                  {loading ? 'Processing...' : user.status === 'banned' ? 'Unban User' : 'Ban User'}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        
        {/* Delete User Confirmation Drawer */}
        <Drawer open={showDeleteDrawer} onOpenChange={setShowDeleteDrawer}>
          <DrawerContent>
            <DrawerHeader className="border-b">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-lg font-semibold">Delete User</DrawerTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowDeleteDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <DrawerDescription className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the user account for <span className="font-medium">{user.email}</span>. This action cannot be undone.
                </p>
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <div className={buttonContainerClasses}>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button 
                  disabled={loading}
                  onClick={handleDeleteUser}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Processing...' : 'Delete User'}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
} 