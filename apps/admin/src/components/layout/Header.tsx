import { useAuth } from "../../lib/auth";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { GlobalSearch } from "../search/GlobalSearch";
import { ThemeToggle } from "../ui/theme-toggle";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LayoutDashboard,
  Settings,
  User,
  Activity,
  HelpCircle,
  LogOut,
  Shield,
  Mail,
  Home,
} from "lucide-react";
import { AdminNotificationsPopover } from "./AdminNotificationsPopover";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-md mx-4">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user && <AdminNotificationsPopover />}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.name?.charAt(0) || user.email?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user.name || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || "Admin User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Quick Navigation */}
              <DropdownMenuItem 
                onClick={() => {
                  const homepageUrl = import.meta.env.VITE_APP_URL || "https://cenety.com";
                  window.open(homepageUrl, "_blank");
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Homepage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/activity")}>
                <Activity className="mr-2 h-4 w-4" />
                Activity Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/emails")}>
                <Mail className="mr-2 h-4 w-4" />
                Emails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Account & Settings */}
              <DropdownMenuItem onClick={() => navigate("/users")}>
                <User className="mr-2 h-4 w-4" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/roles")}>
                <Shield className="mr-2 h-4 w-4" />
                Roles & Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/system")}>
                <Activity className="mr-2 h-4 w-4" />
                System Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Support */}
              <DropdownMenuItem onClick={() => navigate("/support")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support & Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
