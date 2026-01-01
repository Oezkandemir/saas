"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Building2, 
  FileText, 
  QrCode, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Onboarding");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [companyData, setCompanyData] = useState({
    companyName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Deutschland",
    taxId: "",
    email: "",
    phone: "",
  });

  const [firstCustomer, setFirstCustomer] = useState({
    name: "",
    email: "",
    company: "",
  });

  const steps = [
    {
      title: "Willkommen bei Cenety",
      description: "Lassen Sie uns Ihr Konto in 3 einfachen Schritten einrichten",
      icon: Sparkles,
    },
    {
      title: "Unternehmensdaten",
      description: "Diese Informationen erscheinen auf Ihren Rechnungen und Angeboten",
      icon: Building2,
    },
    {
      title: "Erster Kunde (Optional)",
      description: "Fügen Sie Ihren ersten Kunden hinzu",
      icon: FileText,
    },
    {
      title: "Fertig!",
      description: "Ihr Account ist jetzt eingerichtet",
      icon: Check,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      await handleComplete();
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Save company data and customer data via server actions
      // await createCompanyProfile(companyData);
      // if (firstCustomer.name) {
      //   await createCustomer(firstCustomer);
      // }

      // Mark onboarding as complete
      localStorage.setItem("onboarding_completed", "true");

      toast({
        title: "Willkommen!",
        description: "Ihr Account wurde erfolgreich eingerichtet.",
      });

      onComplete();
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    if (onSkip) {
      onSkip();
    }
    router.push("/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Willkommen bei Cenety!</h2>
              <p className="text-muted-foreground">
                Ihr Business-Toolkit für Angebote, Rechnungen und QR-Codes
              </p>
            </div>
            <div className="grid gap-4 pt-4 text-left sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <Building2 className="mb-2 h-6 w-6 text-blue-600" />
                <h3 className="font-semibold">Kundenverwaltung</h3>
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie alle Kundendaten zentral
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <FileText className="mb-2 h-6 w-6 text-green-600" />
                <h3 className="font-semibold">Dokumente</h3>
                <p className="text-sm text-muted-foreground">
                  Erstellen Sie Angebote und Rechnungen
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <QrCode className="mb-2 h-6 w-6 text-purple-600" />
                <h3 className="font-semibold">QR-Codes</h3>
                <p className="text-sm text-muted-foreground">
                  Dynamische QR-Codes mit Analytics
                </p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Firmenname *</Label>
                <Input
                  id="companyName"
                  value={companyData.companyName}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, companyName: e.target.value })
                  }
                  placeholder="Ihre Firma GmbH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, email: e.target.value })
                  }
                  placeholder="info@firma.de"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) =>
                  setCompanyData({ ...companyData, address: e.target.value })
                }
                placeholder="Musterstraße 123"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postalCode">PLZ</Label>
                <Input
                  id="postalCode"
                  value={companyData.postalCode}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, postalCode: e.target.value })
                  }
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={companyData.city}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, city: e.target.value })
                  }
                  placeholder="Berlin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  value={companyData.country}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, country: e.target.value })
                  }
                  placeholder="Deutschland"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxId">Steuernummer</Label>
                <Input
                  id="taxId"
                  value={companyData.taxId}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, taxId: e.target.value })
                  }
                  placeholder="DE123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, phone: e.target.value })
                  }
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground">
              Fügen Sie optional Ihren ersten Kunden hinzu. Sie können dies auch später tun.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Kundenname</Label>
                <Input
                  id="customerName"
                  value={firstCustomer.name}
                  onChange={(e) =>
                    setFirstCustomer({ ...firstCustomer, name: e.target.value })
                  }
                  placeholder="Max Mustermann"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">E-Mail</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={firstCustomer.email}
                  onChange={(e) =>
                    setFirstCustomer({ ...firstCustomer, email: e.target.value })
                  }
                  placeholder="kunde@beispiel.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCompany">Firma</Label>
                <Input
                  id="customerCompany"
                  value={firstCustomer.company}
                  onChange={(e) =>
                    setFirstCustomer({ ...firstCustomer, company: e.target.value })
                  }
                  placeholder="Kunden GmbH"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Alles bereit!</h2>
              <p className="text-muted-foreground">
                Ihr Account ist jetzt eingerichtet und einsatzbereit.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-6">
              <h3 className="mb-4 font-semibold">Nächste Schritte:</h3>
              <ul className="space-y-2 text-left text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Erkunden Sie Ihr Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Erstellen Sie Ihr erstes Dokument
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Generieren Sie Ihren ersten QR-Code
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              {steps[currentStep].icon && React.createElement(steps[currentStep].icon, {
                className: "h-6 w-6 text-blue-600 dark:text-blue-400"
              })}
            </div>
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>{renderStepContent()}</CardContent>

        <CardFooter className="flex justify-between">
          <div>
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 && (
              <Button variant="outline" onClick={handleSkip}>
                Überspringen
              </Button>
            )}
            <Button onClick={handleNext} disabled={isSubmitting}>
              {currentStep === steps.length - 1 ? (
                "Los geht's!"
              ) : (
                <>
                  Weiter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

