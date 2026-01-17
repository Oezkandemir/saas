import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { TwoFactorLoginForm } from "../components/auth/TwoFactorLoginForm";
import { checkTwoFactorEnabledByEmail } from "../api/admin-2fa-login";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState("");
  const navigate = useNavigate();

  const check2FA = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("two_factor_auth")
        .select("enabled")
        .eq("user_id", userId)
        .eq("enabled", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking 2FA:", error);
        return false;
      }

      return !!data?.enabled;
    } catch (err) {
      console.error("Error checking 2FA:", err);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Check if 2FA is enabled for this user
        const has2FA = await check2FA(data.user.id);

        if (has2FA) {
          // Store password temporarily and show 2FA form
          setStoredPassword(password);
          setTwoFactorUserId(data.user.id);
          setShow2FA(true);
          setLoading(false);
          // Sign out temporarily until 2FA is verified
          await supabase.auth.signOut();
        } else {
          // No 2FA, proceed with normal login
          setTimeout(() => {
            navigate("/");
          }, 100);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handle2FASuccess = async () => {
    // Re-authenticate with password after 2FA verification
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: storedPassword,
      });

      if (error) {
        setError(error.message);
        setShow2FA(false);
        setTwoFactorUserId(null);
        setStoredPassword("");
        return;
      }

      if (data?.user) {
        // Clear stored password
        setStoredPassword("");
        setShow2FA(false);
        setTwoFactorUserId(null);
        // Navigate to dashboard
        setTimeout(() => {
          navigate("/");
        }, 100);
      }
    } catch (err) {
      setError("Failed to complete login");
      setShow2FA(false);
      setTwoFactorUserId(null);
      setStoredPassword("");
    }
  };

  // Show 2FA form if 2FA is required
  if (show2FA && twoFactorUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <TwoFactorLoginForm
          userId={twoFactorUserId}
          onSuccess={handle2FASuccess}
          onCancel={() => {
            setShow2FA(false);
            setTwoFactorUserId(null);
            setStoredPassword("");
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
