import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import CustomersPage from "./pages/CustomersPage";
import DocumentsPage from "./pages/DocumentsPage";
import QRCodesPage from "./pages/QRCodesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import BookingsPage from "./pages/BookingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RevenuePage from "./pages/RevenuePage";
import PlansPage from "./pages/PlansPage";
import RolesPage from "./pages/RolesPage";
import WebhooksPage from "./pages/WebhooksPage";
import EmailsPage from "./pages/EmailsPage";
import CompaniesPage from "./pages/CompaniesPage";
import BlogPage from "./pages/BlogPage";
import SystemPage from "./pages/SystemPage";
import SupportPage from "./pages/SupportPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import FeatureUsagePage from "./pages/FeatureUsagePage";
import DocumentTemplatesPage from "./pages/DocumentTemplatesPage";
import LoginPage from "./pages/LoginPage";
import SchedulingPage from "./pages/SchedulingPage";
import EventTypesPage from "./pages/EventTypesPage";
import TimeSlotsPage from "./pages/TimeSlotsPage";
import AvailabilityRulesPage from "./pages/AvailabilityRulesPage";
import DateOverridesPage from "./pages/DateOverridesPage";
import { AdminLayout } from "./components/layout/AdminLayout";
import { KeyboardShortcuts } from "./components/ui/keyboard-shortcuts";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";

function AppContent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const shortcuts = [
    {
      keys: ["meta", "k"],
      description: "Open global search",
      category: "Navigation",
    },
    {
      keys: ["meta", "shift", "?"],
      description: "Show keyboard shortcuts",
      category: "General",
    },
    {
      keys: ["meta", "1"],
      description: "Go to Dashboard",
      category: "Navigation",
    },
    {
      keys: ["meta", "2"],
      description: "Go to Users",
      category: "Navigation",
    },
    {
      keys: ["meta", "3"],
      description: "Go to Customers",
      category: "Navigation",
    },
    {
      keys: ["meta", "4"],
      description: "Go to Documents",
      category: "Navigation",
    },
    {
      keys: ["meta", "5"],
      description: "Go to Analytics",
      category: "Navigation",
    },
  ];

  useKeyboardShortcuts([
    {
      keys: ["meta", "1"],
      callback: () => navigate("/"),
    },
    {
      keys: ["meta", "2"],
      callback: () => navigate("/users"),
    },
    {
      keys: ["meta", "3"],
      callback: () => navigate("/customers"),
    },
    {
      keys: ["meta", "4"],
      callback: () => navigate("/documents"),
    },
    {
      keys: ["meta", "5"],
      callback: () => navigate("/analytics"),
    },
  ]);

  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/qr-codes" element={<QRCodesPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/revenue" element={<RevenuePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="/emails" element={<EmailsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/analytics/feature-usage" element={<FeatureUsagePage />} />
        <Route path="/document-templates" element={<DocumentTemplatesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/scheduling/event-types" element={<EventTypesPage />} />
        <Route path="/scheduling/time-slots" element={<TimeSlotsPage />} />
        <Route path="/scheduling/availability-rules" element={<AvailabilityRulesPage />} />
        <Route path="/scheduling/date-overrides" element={<DateOverridesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <KeyboardShortcuts shortcuts={shortcuts} triggerKey="?" />
    </>
  );
}

function App() {
  const { user, loading } = useAuth();

  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey && 
                       supabaseUrl !== "https://placeholder.supabase.co";

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Configuration Required
            </h1>
            <p className="text-gray-600 mb-6">
              Missing Supabase environment variables. Please create a <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env</code> file in the <code className="bg-gray-100 px-2 py-1 rounded text-sm">apps/admin</code> directory with:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-left mb-6">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:3000`}
              </pre>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Check the README.md for setup instructions.
            </p>
            <div className="text-xs text-gray-400 mt-4">
              <p>Current status:</p>
              <p>VITE_SUPABASE_URL: {supabaseUrl ? "✓ Set" : "✗ Missing"}</p>
              <p>VITE_SUPABASE_ANON_KEY: {supabaseAnonKey ? "✓ Set" : "✗ Missing"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <div className="text-sm text-muted-foreground mt-4">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AppContent />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
