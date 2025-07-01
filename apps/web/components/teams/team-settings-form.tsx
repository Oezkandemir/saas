"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Settings, Save, Upload, Trash2, AlertTriangle, Building2, Globe, Mail, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const teamSettingsSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  logoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  billingEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

type TeamSettingsValues = z.infer<typeof teamSettingsSchema>;

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  billingEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamSettingsFormProps {
  team: Team;
  userRole: string;
}

export function TeamSettingsForm({ team, userRole }: TeamSettingsFormProps) {
  const router = useRouter();
  const t = useTranslations("Teams");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TeamSettingsValues>({
    resolver: zodResolver(teamSettingsSchema),
    defaultValues: {
      name: team.name || "",
      description: team.description || "",
      logoUrl: team.logoUrl || "",
      billingEmail: team.billingEmail || "",
    },
  });

  const onSubmit = async (data: TeamSettingsValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update team settings");
      }

      toast.success("Team settings updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating team settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update team settings");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = userRole === "OWNER";
  const canEdit = userRole === "OWNER" || userRole === "ADMIN";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Team Settings</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Manage your team&apos;s basic information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Team Avatar */}
              <div className="space-y-3 sm:space-y-4">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Team Logo</label>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-border flex-shrink-0">
                    {form.watch("logoUrl") || team.logoUrl ? (
                      <AvatarImage src={form.watch("logoUrl") || team.logoUrl} alt={team.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-lg sm:text-xl font-bold">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 w-full">
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo.png"
                              {...field}
                              disabled={!canEdit || isLoading}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter a URL for your team logo. Recommended: 500x500px, max 5MB.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Team Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Team Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Team"
                        {...field}
                        disabled={!canEdit || isLoading}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This is your team&apos;s display name. It will be visible to all team members.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Team Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your team and what you do..."
                        className="min-h-[80px] sm:min-h-[100px] text-sm resize-none"
                        {...field}
                        disabled={!canEdit || isLoading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Help others understand what your team does. Maximum 500 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Email */}
              <FormField
                control={form.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Billing Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="billing@example.com"
                        {...field}
                        disabled={!canEdit || isLoading}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Email address for billing and invoices. Defaults to team owner&apos;s email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="gap-2 w-full sm:w-auto order-2 sm:order-1"
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isLoading}
                    className="w-full sm:w-auto order-1 sm:order-2"
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Information */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Team Information</CardTitle>
          </div>
          <CardDescription className="text-sm">
            General information about your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Team ID</label>
              <div className="p-2 sm:p-3 bg-muted rounded-md">
                <code className="text-xs font-mono">{team.id}</code>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Team Slug</label>
              <div className="p-2 sm:p-3 bg-muted rounded-md flex items-center gap-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <code className="text-xs font-mono">{team.slug}</code>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <div className="p-2 sm:p-3 bg-muted rounded-md text-xs">
                {new Date(team.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <div className="p-2 sm:p-3 bg-muted rounded-md text-xs">
                {new Date(team.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Your Permissions</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Your role and permissions in this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Your Role</div>
              <div className="text-xs text-muted-foreground">Determines what actions you can perform</div>
            </div>
            <Badge variant={isOwner ? "default" : "secondary"} className="w-fit">
              {userRole}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm mb-2">Team Management</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className={canEdit ? "text-green-600" : "text-muted-foreground"}>
                  ✓ Edit team settings
                </div>
                <div className={canEdit ? "text-green-600" : "text-muted-foreground"}>
                  ✓ Manage members
                </div>
                <div className={isOwner ? "text-green-600" : "text-muted-foreground"}>
                  {isOwner ? "✓" : "✗"} Delete team
                </div>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm mb-2">Member Actions</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="text-green-600">✓ View team</div>
                <div className="text-green-600">✓ Access projects</div>
                <div className={canEdit ? "text-green-600" : "text-muted-foreground"}>
                  {canEdit ? "✓" : "✗"} Invite members
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for owners */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              <CardTitle className="text-lg sm:text-xl text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Irreversible actions that will permanently affect your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Delete Team</AlertTitle>
              <AlertDescription className="text-xs">
                Once you delete a team, there is no going back. Please be certain.
              </AlertDescription>
            </Alert>
                         <div className="flex justify-start">
               <Button 
                 variant="destructive" 
                 className="gap-2 w-full sm:w-auto"
                 size="sm"
                 onClick={() => router.push(`/dashboard/teams/${team.id}/delete`)}
               >
                 <Trash2 className="h-4 w-4" />
                 Delete Team
               </Button>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 