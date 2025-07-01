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
    <div className="space-y-4 sm:space-y-6">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm sm:text-base">Danger Zone</AlertTitle>
        <AlertDescription className="text-xs sm:text-sm">
          This action cannot be undone. Deleting this team will permanently remove all associated data.
        </AlertDescription>
      </Alert>

      {/* Impact Overview */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">What will be deleted?</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Review what will happen when you delete this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4">
            {dataImpactItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3 sm:gap-4 sm:p-4">
                  <div className={`flex-shrink-0 rounded-full bg-background p-2 shadow-sm`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-lg font-bold ${item.color}`}>
                        {item.count}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Additional consequences:</h4>
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground sm:text-sm">
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
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            <CardTitle className="text-lg text-destructive sm:text-xl">Delete Team</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Permanently delete &quot;{team.name}&quot; and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-sm">Final Warning</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                <strong>This action is irreversible.</strong> All data associated with this team will be permanently lost.
                Please ensure you have exported any important data before proceeding.
              </AlertDescription>
            </Alert>

            <div className="flex justify-start">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2 sm:w-auto" size="sm">
                    <Trash2 className="h-4 w-4" />
                    Delete Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg">Confirm Team Deletion</DialogTitle>
                    <DialogDescription className="text-sm">
                      This is your final chance to reconsider. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onDelete)} className="space-y-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Are you absolutely sure?</AlertTitle>
                                                 <AlertDescription className="text-xs">
                           This will permanently delete the team <strong>&quot;{team.name}&quot;</strong> and all its data.
                         </AlertDescription>
                      </Alert>

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
                              <FormLabel className="text-xs font-normal sm:text-sm">
                                I understand that all team data will be permanently deleted
                              </FormLabel>
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
                              <FormLabel className="text-xs font-normal sm:text-sm">
                                I understand that all team members will lose access
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Type &quot;confirm delete team&quot; to proceed</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="confirm delete team"
                                {...field}
                                disabled={isLoading}
                                className="text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isLoading}
                          className="w-full sm:w-auto"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={
                            isLoading ||
                            !form.watch("acknowledgeData") ||
                            !form.watch("acknowledgeMembers") ||
                            form.watch("confirmText") !== "confirm delete team"
                          }
                          className="w-full sm:w-auto"
                          size="sm"
                        >
                          {isLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team Forever
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