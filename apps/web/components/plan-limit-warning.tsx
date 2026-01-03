import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/alignui/actions/button';
import { AlertTriangle, ArrowUp } from "lucide-react";
import Link from "next/link";
import { getPlanLimitInfo } from "@/actions/plan-limits-actions";
import { LimitType } from "@/lib/plan-limits";

interface PlanLimitWarningProps {
  userId: string;
  limitType: LimitType;
  className?: string;
}

export async function PlanLimitWarning({
  userId,
  limitType,
  className,
}: PlanLimitWarningProps) {
  const limitInfo = await getPlanLimitInfo(limitType);

  if (!limitInfo || limitInfo.limit === Infinity) {
    return null;
  }
  
  const limitInfoData = limitInfo;

  const percentage = (limitInfoData.current / limitInfoData.limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  const getLimitTypeLabel = () => {
    switch (limitType) {
      case "customers":
        return "Kunden";
      case "qr_codes":
        return "QR-Codes";
      case "documents":
        return "Dokumente";
      default:
        return "Ressource";
    }
  };

  return (
    <Alert
      variant={isAtLimit ? "destructive" : "default"}
      className={className}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit
          ? `Limit erreicht: ${getLimitTypeLabel()}`
          : `Warnung: ${getLimitTypeLabel()}-Limit fast erreicht`}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Sie haben {limitInfoData.current} von {limitInfoData.limit}{" "}
          {getLimitTypeLabel()} verwendet.
          {isAtLimit && limitInfoData.message && (
            <span className="block mt-1">{limitInfoData.message}</span>
          )}
        </p>
        {isNearLimit && !isAtLimit && (
          <p className="text-sm text-muted-foreground">
            Bitte upgraden Sie auf einen Pro- oder Enterprise-Plan, um
            unbegrenzt {getLimitTypeLabel().toLowerCase()} zu erstellen.
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Link href="/pricing">
            <Button size="sm" variant={isAtLimit ? "primary" : "outline"}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Jetzt upgraden
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

