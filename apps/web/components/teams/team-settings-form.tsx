"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Settings, Save, Upload, Trash2, AlertTriangle, Building2, Globe, Mail } from "lucide-react";
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
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Team Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your team&apos;s basic information and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Team Avatar */}
              <div className="space-y-4">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Team Logo</label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    {form.watch("logoUrl") || team.logoUrl ? (
                      <AvatarImage src={form.watch("logoUrl") || team.logoUrl} alt={team.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-xl font-bold">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
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
                            />
                          </FormControl>
                          <FormDescription>
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
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Team"
                        {...field}
                        disabled={!canEdit || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your team and what you do..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={!canEdit || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Billing Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="billing@company.com"
                        {...field}
                        disabled={!isOwner || isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Email address for billing notifications. Only team owners can modify this.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Team Information</CardTitle>
          </div>
          <CardDescription>
            Read-only team information and metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team ID</label>
              <div className="p-2 bg-muted rounded-md">
                <code className="text-sm">{team.id}</code>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Slug</label>
              <div className="p-2 bg-muted rounded-md">
                <code className="text-sm">{team.slug}</code>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Created</label>
              <div className="p-2 bg-muted rounded-md">
                <span className="text-sm">{new Date(team.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Updated</label>
              <div className="p-2 bg-muted rounded-md">
                <span className="text-sm">{new Date(team.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Your Permissions</CardTitle>
          </div>
          <CardDescription>
            Your current role and permissions within this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={userRole === "OWNER" ? "default" : "secondary"}>
                  {userRole}
                </Badge>
                <span className="text-sm font-medium">
                  {userRole === "OWNER" ? "Team Owner" : userRole === "ADMIN" ? "Team Administrator" : "Team Member"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {userRole === "OWNER" 
                  ? "You have full control over this team and can manage all settings."
                  : userRole === "ADMIN"
                  ? "You can manage team settings and invite members."
                  : "You can view team information but cannot modify settings."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone - Only for owners */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                These actions cannot be undone. Please proceed with caution.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div>
                <h4 className="font-semibold text-destructive">Delete Team</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this team and all associated data
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => router.push(`/dashboard/teams/${team.id}/delete`)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 