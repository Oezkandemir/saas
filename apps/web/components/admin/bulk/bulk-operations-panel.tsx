"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Mail, Download, Ban, UserCog, CreditCard } from "lucide-react";
import { bulkUserActions, bulkExportUsers, bulkSendEmail } from "@/actions/admin-bulk-actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface BulkOperationsPanelProps {
  locale: string;
}

export function BulkOperationsPanel({ locale }: BulkOperationsPanelProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userIdsInput, setUserIdsInput] = useState("");
  const [action, setAction] = useState<"ban" | "unban" | "delete" | "change_role" | "change_plan">("ban");
  const [actionValue, setActionValue] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [loading, setLoading] = useState(false);

  const parseUserIds = (input: string): string[] => {
    return input
      .split(/[,\n\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  const handleBulkAction = async () => {
    const ids = selectedUserIds.length > 0 ? selectedUserIds : parseUserIds(userIdsInput);
    
    if (ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select users or enter user IDs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await bulkUserActions(ids, action, actionValue);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.errors?.join(", ") || "Failed to perform bulk action",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const ids = selectedUserIds.length > 0 ? selectedUserIds : parseUserIds(userIdsInput);
    
    if (ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select users or enter user IDs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await bulkExportUsers(ids);
      
      if (result.success && result.data) {
        const json = JSON.stringify(result.data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: `Exported ${result.data.length} users`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to export users",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const ids = selectedUserIds.length > 0 ? selectedUserIds : parseUserIds(userIdsInput);
    
    if (ids.length === 0) {
      toast({
        title: "Error",
        description: "Please select users or enter user IDs",
        variant: "destructive",
      });
      return;
    }

    if (!emailSubject || !emailBody) {
      toast({
        title: "Error",
        description: "Please enter subject and body",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await bulkSendEmail(ids, emailSubject, emailBody);
      
      toast({
        title: result.success ? "Success" : "Partial Success",
        description: `Sent ${result.sent} emails, ${result.failed} failed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Bulk User Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <Users className="size-4 text-primary" />
            Bulk User Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Perform actions on multiple users at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userIds">User IDs (comma or newline separated)</Label>
            <Textarea
              id="userIds"
              placeholder="Enter user IDs..."
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={(v: any) => setAction(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ban">Ban Users</SelectItem>
                <SelectItem value="unban">Unban Users</SelectItem>
                <SelectItem value="delete">Delete Users</SelectItem>
                <SelectItem value="change_role">Change Role</SelectItem>
                <SelectItem value="change_plan">Change Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === "change_role" || action === "change_plan") && (
            <div className="space-y-2">
              <Label htmlFor="actionValue">
                {action === "change_role" ? "New Role" : "New Plan"}
              </Label>
              <Input
                id="actionValue"
                placeholder={action === "change_role" ? "ADMIN or USER" : "Plan ID"}
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleBulkAction} disabled={loading} className="w-full">
            <Ban className="size-4 mr-2" />
            Execute Bulk Action
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <Download className="size-4 text-primary" />
            Bulk Export
          </CardTitle>
          <CardDescription className="text-xs">
            Export user data as JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exportUserIds">User IDs (comma or newline separated)</Label>
            <Textarea
              id="exportUserIds"
              placeholder="Enter user IDs..."
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleExport} disabled={loading} className="w-full">
            <Download className="size-4 mr-2" />
            Export Users
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Email */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-sm">
            <Mail className="size-4 text-primary" />
            Bulk Email
          </CardTitle>
          <CardDescription className="text-xs">
            Send email to multiple users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailUserIds">User IDs (comma or newline separated)</Label>
            <Textarea
              id="emailUserIds"
              placeholder="Enter user IDs..."
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject</Label>
            <Input
              id="emailSubject"
              placeholder="Email subject..."
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">Body</Label>
            <Textarea
              id="emailBody"
              placeholder="Email body..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
            />
          </div>

          <Button onClick={handleSendEmail} disabled={loading} className="w-full">
            <Mail className="size-4 mr-2" />
            Send Bulk Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

