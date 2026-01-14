"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createCustomer,
  type CustomerInput,
} from "@/actions/customers-actions";
import { RiInformationFill } from "@remixicon/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ButtonRoot } from "@/components/ui/button";
import { HintIcon, HintRoot } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  LabelAsterisk,
  Label,
  LabelSub,
} from "@/components/ui/label";
import {
  TextareaCharCounter,
  Textarea,
} from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Button = {
  Root: ButtonRoot,
};

const Hint = {
  Root: HintRoot,
  Icon: HintIcon,
};

const LabelNS = {
  Root: Label,
  Asterisk: LabelAsterisk,
  Sub: LabelSub,
};

const TextareaNS = {
  Root: Textarea,
  CharCounter: TextareaCharCounter,
};

interface NewCustomerDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function NewCustomerDrawer({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: NewCustomerDrawerProps) {
  const router = useRouter();
  const t = useTranslations("Customers.form.fields");
  const tForm = useTranslations("Customers.form");
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [formData, setFormData] = React.useState<CustomerInput>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(tForm("nameRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const newCustomer = await createCustomer(formData);
      toast.success(tForm("createSuccess"), {
        description: tForm("createSuccessDescription", { name: formData.name }),
      });
      setOpen(false);
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
      });
      router.refresh();
      router.push(`/dashboard/customers/${newCustomer.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : tForm("errorOccurred");
      toast.error(tForm("createError"), {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="w-[min(400px,calc(100%-16px))] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>{tForm("newCustomer")}</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto flex-1 px-6 pb-4">
          {/* Form Fields */}
          <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <LabelNS.Root htmlFor="name">
                  Name <LabelNS.Asterisk />
                </LabelNS.Root>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <LabelNS.Root htmlFor="email">{t("email")}</LabelNS.Root>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <LabelNS.Root htmlFor="phone">{t("phone")}</LabelNS.Root>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <LabelNS.Root htmlFor="company">
                  {t("company")} <LabelNS.Sub>(Optional)</LabelNS.Sub>
                </LabelNS.Root>
                <Input
                  id="company"
                  type="text"
                  placeholder={t("companyPlaceholder")}
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <LabelNS.Root htmlFor="notes">
                  {t("notes")} <LabelNS.Sub>({tForm("optional")})</LabelNS.Sub>
                </LabelNS.Root>
                <TextareaNS.Root
                  placeholder={t("notesPlaceholder")}
                  className="min-h-[50px]"
                  id="notes"
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  maxLength={500}
                >
                  <TextareaNS.CharCounter
                    current={formData.notes?.length ?? 0}
                    max={500}
                  />
                </TextareaNS.Root>
                <Hint.Root>
                  <Hint.Icon as={RiInformationFill} />
                  {tForm("notesHint")}
                </Hint.Root>
              </div>
            </div>
        </div>

        {/* Footer Buttons - Fixed at bottom */}
        <div className="p-5 mt-auto border-t border-stroke-soft-200 bg-bg-white-0">
          <div className="flex gap-3 justify-between">
            <Button.Root
              variant="outline"
              size="default"
              className="flex-1 px-6 h-12 text-base font-medium border-2 border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 hover:bg-bg-white-50 hover:border-stroke-soft-300"
              onClick={handleDiscard}
              disabled={isLoading}
              type="button"
            >
              {tForm("cancel")}
            </Button.Root>
            <Button.Root
              variant="default"
              size="default"
              className="flex-1 px-6 h-12 text-base font-semibold shadow-sm bg-text-strong-950 text-bg-white-0 hover:bg-text-strong-900 hover:shadow-md"
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
              type="button"
            >
              {isLoading ? tForm("creating") : tForm("createCustomer")}
            </Button.Root>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
