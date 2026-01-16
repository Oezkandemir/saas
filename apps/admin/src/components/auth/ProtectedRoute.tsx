import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { Require2FASetup } from "./Require2FASetup";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
        return;
      }
      
      if (user.role !== "ADMIN") {
        const webAppUrl = import.meta.env.VITE_APP_URL || "http://localhost:3000";
        window.location.href = `${webAppUrl}/dashboard`;
        return;
      }
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need ADMIN role to access this dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to main app...
          </p>
        </div>
      </div>
    );
  }

  // Wrap children with 2FA requirement check
  return <Require2FASetup>{children}</Require2FASetup>;
}
