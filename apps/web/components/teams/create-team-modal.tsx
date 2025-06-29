"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Users, FileText, Image, Sparkles } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function CreateTeamModal() {
  const t = useTranslations("Teams");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t("createTeam.errors.nameRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-team",
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("createTeam.errors.default"));
      }

      const data = await response.json();
      toast.success(t("createTeam.success"));
      
      // Reset form and close modal
      setFormData({ name: "", description: "", logoUrl: "" });
      setOpen(false);
      
      // Navigate to new team
      router.push(`/dashboard/teams/${data.id}`);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(
        error instanceof Error ? error.message : t("createTeam.errors.default"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTeamInitials = (name: string) => {
    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="mr-2 size-4 transition-transform group-hover:rotate-90" />
          {t("createTeam.button")}
          <Sparkles className="ml-2 size-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{t("createTeam.title")}</DialogTitle>
              <DialogDescription className="text-sm">
                {t("createTeam.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Preview */}
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br from-muted/50 to-muted/20 p-6">
            <div className="space-y-2 text-center">
              <Avatar className="mx-auto size-16 border-2 border-background shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold">
                  {formData.name ? getTeamInitials(formData.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {formData.name || t("createTeam.preview.placeholder")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formData.description || t("createTeam.preview.description")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Users className="size-4" />
                {t("createTeam.nameLabel")}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("createTeam.namePlaceholder")}
                className="transition-all focus:ring-2 focus:ring-primary/20"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/50 {t("createTeam.characters")}
              </p>
            </div>

            {/* Team Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="size-4" />
                {t("createTeam.descriptionLabel")}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t("createTeam.descriptionPlaceholder")}
                className="min-h-[80px] transition-all focus:ring-2 focus:ring-primary/20"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/200 {t("createTeam.characters")}
              </p>
            </div>

            {/* Team Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="flex items-center gap-2">
                <Image className="size-4" />
                {t("createTeam.logoLabel")}
                <span className="text-xs text-muted-foreground">({t("createTeam.optional")})</span>
              </Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                placeholder={t("createTeam.logoPlaceholder")}
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                {t("createTeam.logoHelp")}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("createTeam.cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim()}
              className="relative min-w-[100px] overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("createTeam.creating")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  {t("createTeam.create")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 