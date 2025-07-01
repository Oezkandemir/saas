"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AlertTriangle, Trash2, Users, Briefcase, Mail, Shield, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamDeleteFormProps {
  team: Team;
  memberCount: number;
  projectCount: number;
  invitationCount: number;
}

const deleteSchema = z.object({
  confirmText: z.string().min(1, "Please enter the confirmation text"),
  acknowledgeData: z.boolean(),
  acknowledgeMembers: z.boolean(),
});

type DeleteValues = z.infer<typeof deleteSchema>;

export function TeamDeleteForm({ team, memberCount, projectCount, invitationCount }: TeamDeleteFormProps) {
  const router = useRouter();
  const t = useTranslations("Teams");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DeleteValues>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      confirmText: "",
      acknowledgeData: false,
      acknowledgeMembers: false,
    },
  });

  const onDelete = async (data: DeleteValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: data.confirmText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete team");
      }

      toast.success(`Team "${team.name}" has been deleted`);
      router.push("/dashboard/teams");
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete team");
    } finally {
      setIsLoading(false);
    }
  };

  const dataImpactItems = [
    {
      icon: Users,
      label: "Team Members",
      count: memberCount,
      description: "All team members will be removed from this team",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: Briefcase,
      label: "Projects",
      count: projectCount,
      description: "All team projects and their data will be permanently deleted",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: Mail,
      label: "Invitations",
      count: invitationCount,
      description: "All pending team invitations will be cancelled",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone</AlertTitle>
        <AlertDescription>
          This action cannot be undone. Deleting this team will permanently remove all associated data.
        </AlertDescription>
      </Alert>

      {/* Impact Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle>What will be deleted?</CardTitle>
          </div>
          <CardDescription>
            Review what will happen when you delete this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {dataImpactItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20">
                  <div className={`rounded-full p-2 bg-background shadow-sm`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      <span className={`text-lg font-bold ${item.color}`}>
                        {item.count}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium text-destructive">Additional consequences:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Team slug &quot;{team.slug}&quot; will become available for reuse</li>
              <li>All team-specific settings and configurations will be lost</li>
              <li>Team billing history will be archived but no longer accessible</li>
              <li>Any external integrations connected to this team will be disconnected</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Delete Action */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Delete Team</CardTitle>
          </div>
          <CardDescription>
            Permanently delete &quot;{team.name}&quot; and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Final Warning</AlertTitle>
              <AlertDescription>
                <strong>This action is irreversible.</strong> All data associated with this team will be permanently lost.
                Please ensure you have exported any important data before proceeding.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Team</DialogTitle>
                    <DialogDescription>
                      This will permanently delete &quot;{team.name}&quot; and all its data.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onDelete)} className="space-y-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="acknowledgeData"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm">
                                  I understand that all team data will be permanently lost
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="acknowledgeMembers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm">
                                  I understand that all team members will be removed
                                </FormLabel>
                                <FormMessage />
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                To verify, type <strong>confirm delete team</strong> below:
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="confirm delete team"
                                  {...field}
                                  disabled={isLoading}
                                  className="font-mono"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          variant="destructive"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Team
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 