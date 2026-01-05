"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResponsiveNotificationsTabsProps {
  totalCount: number;
  unreadCount: number;
  welcomeCount: number;
  systemCount: number;
  teamCount: number;
  allContent: React.ReactNode;
  unreadContent: React.ReactNode;
  welcomeContent: React.ReactNode;
  systemContent: React.ReactNode;
  teamContent: React.ReactNode;
}

export function ResponsiveNotificationsTabs({
  totalCount,
  unreadCount,
  welcomeCount,
  systemCount,
  teamCount,
  allContent,
  unreadContent,
  welcomeContent,
  systemContent,
  teamContent,
}: ResponsiveNotificationsTabsProps) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Mobile: Select Dropdown */}
      <div className="mb-4 sm:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {activeTab === "all" && `All (${totalCount})`}
              {activeTab === "unread" && `Unread (${unreadCount})`}
              {activeTab === "welcome" && `Welcome (${welcomeCount})`}
              {activeTab === "system" && `System (${systemCount})`}
              {activeTab === "team" && `Team (${teamCount})`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({totalCount})</SelectItem>
            <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
            <SelectItem value="welcome">Welcome ({welcomeCount})</SelectItem>
            <SelectItem value="system">System ({systemCount})</SelectItem>
            <SelectItem value="team">Team ({teamCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Tabs */}
      <div className="mb-4 hidden sm:block">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all" className="text-xs md:text-sm">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs md:text-sm">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="welcome" className="text-xs md:text-sm">
            Welcome ({welcomeCount})
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs md:text-sm">
            System ({systemCount})
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs md:text-sm">
            Team ({teamCount})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all">{allContent}</TabsContent>
      <TabsContent value="unread">{unreadContent}</TabsContent>
      <TabsContent value="welcome">{welcomeContent}</TabsContent>
      <TabsContent value="system">{systemContent}</TabsContent>
      <TabsContent value="team">{teamContent}</TabsContent>
    </Tabs>
  );
}
