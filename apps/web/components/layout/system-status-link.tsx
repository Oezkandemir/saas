import { AlertCircle, CheckCircle2 } from "lucide-react";
import { getPublicSystemStatus } from "@/actions/public-system-status";
import { Link } from "@/i18n/routing";

export async function SystemStatusLink() {
  try {
    const status = await getPublicSystemStatus();

    const hasSystemIssues =
      status.hasErrors || status.overallStatus !== "operational";

    return (
      <Link
        href="/admin/system"
        className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
      >
        {hasSystemIssues ? (
          <>
            <AlertCircle className="size-4 text-red-500" />
            <span className="text-red-500 font-medium">System Error</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 text-green-500" />
            <span className="text-green-500 font-medium">All systems ok</span>
          </>
        )}
      </Link>
    );
  } catch (_error) {
    // On error, show neutral status
    return (
      <Link
        href="/admin/system"
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <CheckCircle2 className="size-4" />
        <span>System Status</span>
      </Link>
    );
  }
}
