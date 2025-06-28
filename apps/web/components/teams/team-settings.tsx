"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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

type TeamRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

interface TeamSettingsProps {
  team: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
  };
  userRole: TeamRole;
}

export function TeamSettings({ team, userRole }: TeamSettingsProps) {
  const t = useTranslations("Teams");
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
    logo_url: team.logo_url || "",
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
      toast.error(t("teamSettings.errors.nameRequired"));
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-team",
          id: team.id,
          name: formData.name,
          description: formData.description,
          logo_url: formData.logo_url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("teamSettings.errors.default"));
      }

      toast.success(t("teamSettings.success"));
      router.refresh();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("teamSettings.errors.default"),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const isOwner = userRole === "OWNER";

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t("teamSettings.title")}</CardTitle>
          <CardDescription>{t("teamSettings.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="required">
              {t("teamSettings.nameLabel")}
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={t("teamSettings.namePlaceholder")}
              value={formData.name}
              onChange={handleChange}
              disabled={!isOwner || isUpdating}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">
              {t("teamSettings.descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder={t("teamSettings.descriptionPlaceholder")}
              value={formData.description}
              onChange={handleChange}
              disabled={!isOwner || isUpdating}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo_url">{t("teamSettings.logoLabel")}</Label>
            <Input
              id="logo_url"
              name="logo_url"
              placeholder={t("teamSettings.logoPlaceholder")}
              value={formData.logo_url}
              onChange={handleChange}
              disabled={!isOwner || isUpdating}
            />
            <p className="text-sm text-muted-foreground">
              {t("teamSettings.logoHelp")}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={!isOwner || isUpdating || !formData.name.trim()}
          >
            {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("teamSettings.saveButton")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
