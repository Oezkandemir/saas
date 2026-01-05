"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteUser,
  toggleUserAdminStatus,
  toggleUserBanStatus,
} from "@/actions/admin-user-actions";
import {
  MoreHorizontal,
  Shield,
  Trash,
  Unlock,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { UserAvatar } from "@/components/shared/user-avatar";

import { User } from "./columns";
import { logger } from "@/lib/logger";

interface UserActionsProps {
  user: User;
  inline?: boolean; // Prop for inline display
  compact?: boolean; // New prop for compact view in header
  isExpanded?: boolean; // Whether the parent accordion item is expanded
}

// Define Tailwind class combinations to avoid lint errors
const flexContainerClasses = "flex flex-wrap justify-center gap-2";
const userInfoContainerClasses = "mb-4 flex items-center gap-3 border-b pb-4";
const buttonContainerClasses = "flex justify-end gap-2";

export function UserActions({
  user,
  inline = false,
  compact = false,
  isExpanded = false,
}: UserActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("Admin.users");
  const tTable = useTranslations("Admin.table");

  const [showDeleteDrawer, setShowDeleteDrawer] = useState(false);
  const [showBanDrawer, setShowBanDrawer] = useState(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle user ban/unban
  const handleBanUser = async () => {
    try {
      setLoading(true);

      // Call the server action
      const result = await toggleUserBanStatus(user.id, user.status);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success toast
      toast({
        title:
          user.status === "banned" ? tTable("unbanUser") : tTable("banUser"),
        description: `Successfully ${user.status === "banned" ? "unbanned" : "banned"} ${user.email}`,
      });

      // Refresh the page data
      router.refresh();
    } catch (err) {
      logger.error("Error banning/unbanning user:", err);

      toast({
        title: "Operation Failed",
        description: `Failed to ${user.status === "banned" ? "unban" : "ban"} user. Please try again.`,
        variant: "destructive",
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

      // Call the server action
      const result = await deleteUser(user.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success toast
      toast({
        title: "User Deleted",
        description: t("userDeleted"),
      });

      // Refresh the page data
      router.refresh();
    } catch (err) {
      logger.error("Error deleting user:", err);

      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
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

      // Call the server action
      const result = await toggleUserAdminStatus(user.id, user.role);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show success toast with translated texts
      toast({
        title:
          user.role === "ADMIN"
            ? "Admin Rights Removed"
            : "Admin Rights Granted",
        description: `Successfully ${user.role === "ADMIN" ? "removed admin rights from" : "granted admin rights to"} ${user.email}`,
      });

      // Refresh the page data
      router.refresh();
    } catch (err) {
      logger.error("Error toggling admin status:", err);

      toast({
        title: "Operation Failed",
        description: `Failed to ${user.role === "ADMIN" ? "remove admin rights" : "grant admin rights"}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowAdminDrawer(false);
    }
  };

  // For compact view in the accordion header
  if (compact) {
    return (
      <>
        <div className="flex gap-1">
          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion from toggling
              if (!loading) setShowAdminDrawer(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) setShowAdminDrawer(true);
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md transition-all duration-200",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              user.role === "ADMIN"
                ? "text-blue-600 hover:text-blue-700"
                : "text-purple-600 hover:text-purple-700",
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-muted",
            )}
          >
            <Shield className="size-4" />
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {user.role === "ADMIN"
                  ? tTable("removeAdmin")
                  : tTable("makeAdmin")}
              </span>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion from toggling
              if (!loading) setShowBanDrawer(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) setShowBanDrawer(true);
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md transition-all duration-200",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              user.status === "banned"
                ? "text-green-600 hover:text-green-700"
                : "text-amber-600 hover:text-amber-700",
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-muted",
            )}
          >
            {user.status === "banned" ? (
              <Unlock className="size-4" />
            ) : (
              <X className="size-4" />
            )}
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {user.status === "banned"
                  ? tTable("unbanUser")
                  : tTable("banUser")}
              </span>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion from toggling
              if (!loading) setShowDeleteDrawer(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (!loading) setShowDeleteDrawer(true);
              }
            }}
            className={cn(
              "flex h-8 items-center rounded-md text-red-600 transition-all duration-200 hover:text-red-700",
              isExpanded ? "w-auto px-2" : "w-8 justify-center p-0",
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-muted",
            )}
          >
            <Trash className="size-4" />
            {isExpanded && (
              <span className="ml-1 overflow-hidden whitespace-nowrap text-xs">
                {t("actions.delete")}
              </span>
            )}
          </div>
        </div>

        {/* Confirmation Drawers are shared between all views */}
        {renderConfirmationDrawers()}
      </>
    );
  }

  // For inline view, show buttons directly instead of dropdown
  if (inline) {
    return (
      <div className={flexContainerClasses}>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setShowAdminDrawer(true)}
        >
          <Shield className="mr-1 size-4" />
          {user.role === "ADMIN" ? tTable("removeAdmin") : tTable("makeAdmin")}
        </Button>

        <Button
          variant={user.status === "banned" ? "outline" : "destructive"}
          size="sm"
          disabled={loading}
          onClick={() => setShowBanDrawer(true)}
        >
          {user.status === "banned" ? (
            <Unlock className="mr-1 size-4" />
          ) : (
            <X className="mr-1 size-4" />
          )}
          {user.status === "banned" ? tTable("unbanUser") : tTable("banUser")}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={() => setShowDeleteDrawer(true)}
        >
          <Trash className="mr-1 size-4" />
          {t("actions.delete")}
        </Button>

        {renderConfirmationDrawers()}
      </div>
    );
  }

  // Regular dropdown view for desktop table
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("userDetails")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAdminDrawer(true)}>
            <Shield className="mr-2 size-4" />
            {user.role === "ADMIN"
              ? tTable("removeAdmin")
              : tTable("makeAdmin")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowBanDrawer(true)}>
            {user.status === "banned" ? (
              <>
                <Unlock className="mr-2 size-4" />
                {tTable("unbanUser")}
              </>
            ) : (
              <>
                <X className="mr-2 size-4" />
                {tTable("banUser")}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={() => setShowDeleteDrawer(true)}
          >
            <Trash className="mr-2 size-4" />
            {t("actions.delete")}
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
                  {user.role === "ADMIN"
                    ? "Remove Admin Rights"
                    : "Grant Admin Rights"}
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdminDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DrawerDescription className="mt-4">
                  {user.role === "ADMIN"
                    ? `This will remove admin privileges from ${user.email}.`
                    : `This will grant admin privileges to ${user.email}, giving them full access to the admin panel.`}
                </DrawerDescription>
              </div>
            </DrawerHeader>
            <DrawerFooter>
              <div className={buttonContainerClasses}>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button
                  disabled={loading}
                  onClick={handleToggleAdmin}
                  className={
                    user.role === "ADMIN"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }
                >
                  {loading
                    ? "Processing..."
                    : user.role === "ADMIN"
                      ? "Remove Admin"
                      : "Make Admin"}
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
                  {user.status === "banned" ? "Unban User" : "Ban User"}
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBanDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DrawerDescription className="mt-4">
                  {user.status === "banned"
                    ? `This will unban ${user.email} and restore their access to the application.`
                    : `This will ban ${user.email} and prevent them from accessing the application.`}
                </DrawerDescription>
              </div>
            </DrawerHeader>
            <DrawerFooter>
              <div className={buttonContainerClasses}>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
                <Button
                  disabled={loading}
                  onClick={handleBanUser}
                  className={
                    user.status === "banned"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }
                >
                  {loading
                    ? "Processing..."
                    : user.status === "banned"
                      ? "Unban User"
                      : "Ban User"}
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
                <DrawerTitle className="text-lg font-semibold">
                  Delete User
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteDrawer(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="mt-4">
                <div className={userInfoContainerClasses}>
                  <UserAvatar className="size-12" user={user} />
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DrawerDescription className="mt-4">
                  This will permanently delete the user account for{" "}
                  <span className="font-medium">{user.email}</span>. This action
                  cannot be undone.
                </DrawerDescription>
              </div>
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
                  {loading ? "Processing..." : "Delete User"}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
}
