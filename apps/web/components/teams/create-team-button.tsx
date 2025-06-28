"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateTeamButton() {
  const t = useTranslations("Teams");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("createTeam.errors.nameRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-team",
          name: formData.name,
          description: formData.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("createTeam.errors.default"));
      }

      toast.success(t("createTeam.success"));
      setIsOpen(false);

      // Navigate to the new team
      router.push(`/dashboard/teams/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(
        error instanceof Error ? error.message : t("createTeam.errors.default"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="mr-2 size-4" />
        {t("createTeam.button")}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("createTeam.title")}</DialogTitle>
            <DialogDescription>{t("createTeam.description")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="required">
                  {t("createTeam.nameLabel")}
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("createTeam.namePlaceholder")}
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  {t("createTeam.descriptionLabel")}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t("createTeam.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                {t("createTeam.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
              >
                {isSubmitting
                  ? t("createTeam.creating")
                  : t("createTeam.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
