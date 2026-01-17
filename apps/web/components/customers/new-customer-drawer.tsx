"use client";

import { RiInformationFill } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
  type CustomerInput,
  createCustomer,
} from "@/actions/customers-actions";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { HintIcon, HintRoot } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label, LabelAsterisk, LabelSub } from "@/components/ui/label";
import { Textarea, TextareaCharCounter } from "@/components/ui/textarea";
import { X } from "lucide-react";

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
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent
        side="right"
        className="w-auto min-w-[280px] max-w-[400px] h-full border-l border-r-0 border-y-0 rounded-none border-border/50 shadow-lg"
      >
        <div className="w-full flex flex-col h-full">
          {/* Header */}
          <DrawerHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg font-semibold">
                {tForm("newCustomer")}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Close drawer"
                >
                  <X className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
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

          {/* Footer Buttons */}
          <div className="border-t px-6 py-4">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDiscard}
                disabled={isLoading}
                type="button"
              >
                {tForm("cancel")}
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                type="button"
              >
                {isLoading ? tForm("creating") : tForm("createCustomer")}
              </Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
