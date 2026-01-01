"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  QRCodeInput,
  createQRCode,
  updateQRCode,
  QRCode,
  QRCodeType,
} from "@/actions/qr-codes-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Icons } from "@/components/shared/icons";
import { QrCode, CheckCircle2 } from "lucide-react";

const qrCodeSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  type: z.enum(["url", "pdf", "text", "whatsapp", "maps"]),
  destination: z.string().min(1, "Ziel ist erforderlich"),
  is_active: z.boolean().default(true),
});

interface QRCodeFormProps {
  qrCode?: QRCode;
}

export function QRCodeForm({ qrCode }: QRCodeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QRCodeInput & { is_active?: boolean }>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: qrCode || {
      name: "",
      type: "url",
      destination: "",
      is_active: true,
    },
  });

  const type = form.watch("type");

  const onSubmit = async (data: QRCodeInput & { is_active?: boolean }) => {
    setIsLoading(true);
    try {
      if (qrCode) {
        await updateQRCode(qrCode.id, data);
        toast.success("QR-Code aktualisiert");
      } else {
        await createQRCode(data);
        toast.success("QR-Code erstellt");
      }
      router.push("/dashboard/qr-codes");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Speichern",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDestinationPlaceholder = () => {
    switch (type) {
      case "url":
        return "https://example.com";
      case "pdf":
        return "https://example.com/document.pdf";
      case "text":
        return "Ihr Text hier";
      case "whatsapp":
        return "+49123456789";
      case "maps":
        return "Adresse oder Koordinaten";
      default:
        return "";
    }
  };

  const getDestinationDescription = () => {
    switch (type) {
      case "url":
        return "Die URL, zu der der QR-Code weiterleiten soll";
      case "pdf":
        return "Die URL zu einer PDF-Datei";
      case "text":
        return "Der Text, der angezeigt werden soll";
      case "whatsapp":
        return "Telefonnummer im internationalen Format (z.B. +49123456789)";
      case "maps":
        return "Adresse oder Koordinaten für Google Maps";
      default:
        return "";
    }
  };

  return (
    <div className="relative">
      <LoadingOverlay
        isLoading={isLoading}
        text={qrCode ? "QR-Code wird aktualisiert..." : "QR-Code wird erstellt..."}
        spinnerSize="lg"
      />
      <Card hover interactive className="border shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          {/* Title removed - now handled by ModernPageHeader on page level */}
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FormLabel className="text-base font-medium">Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                      placeholder="Mein QR-Code"
                    />
                  </FormControl>
                  <FormDescription className="transition-opacity duration-200">
                    Ein aussagekräftiger Name für diesen QR-Code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
                  <FormLabel className="text-base font-medium">Typ *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset destination when type changes
                      form.setValue("destination", "");
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="url">URL-Weiterleitung</SelectItem>
                      <SelectItem value="pdf">PDF-Link</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="maps">Google Maps</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="transition-opacity duration-200">
                    Wählen Sie den Typ des QR-Codes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                  <FormLabel className="text-base font-medium">Ziel *</FormLabel>
                  <FormControl>
                    {type === "text" ? (
                      <Textarea 
                        {...field} 
                        rows={4} 
                        placeholder={getDestinationPlaceholder()}
                        className="text-base resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        disabled={isLoading}
                      />
                    ) : (
                      <Input 
                        {...field} 
                        placeholder={getDestinationPlaceholder()}
                        className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        disabled={isLoading}
                      />
                    )}
                  </FormControl>
                  <FormDescription className="transition-opacity duration-200">
                    {getDestinationDescription()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {qrCode && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 transition-all duration-200 hover:bg-accent/50 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Aktiv</FormLabel>
                      <FormDescription className="transition-opacity duration-200">
                        Deaktivierte QR-Codes leiten nicht weiter
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        className="transition-all duration-200"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {qrCode && (
              <div className="rounded-md border p-4 bg-muted transition-all duration-200 hover:bg-muted/80 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
                <p className="text-sm font-medium mb-2">QR-Code URL:</p>
                <code className="text-xs break-all font-mono">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/q/${qrCode.code}`
                    : `/q/${qrCode.code}`}
                </code>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="h-11 text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-11 text-base font-semibold min-w-[140px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" variant="primary" />
                    <span>Speichern...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Speichern
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      </Card>
    </div>
  );
}

