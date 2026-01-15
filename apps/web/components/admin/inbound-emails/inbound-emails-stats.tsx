"use client";

import { Calendar, Mail, MailOpen, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getInboundEmailStats,
  type InboundEmailStats,
} from "@/actions/inbound-email-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineLoadingState } from "@/components/ui/loading-state";

export function InboundEmailsStats() {
  const [stats, setStats] = useState<InboundEmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const result = await getInboundEmailStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        // Set default stats instead of showing error toast
        setStats({
          total: 0,
          unread: 0,
          today: 0,
          thisWeek: 0,
        });
      }
    } catch (_error) {
      // Set default stats on error
      setStats({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <InlineLoadingState
        isLoading={true}
        text="Lade Email-Statistiken..."
        size="md"
        className="min-h-[200px]"
      />
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: "Gesamt",
      value: stats.total,
      description: "Alle eingehenden Emails",
      icon: Mail,
    },
    {
      title: "Ungelesen",
      value: stats.unread,
      description: "Noch nicht gelesen",
      icon: MailOpen,
      highlight: stats.unread > 0,
    },
    {
      title: "Heute",
      value: stats.today,
      description: "Emails heute empfangen",
      icon: Calendar,
    },
    {
      title: "Diese Woche",
      value: stats.thisWeek,
      description: "Emails in den letzten 7 Tagen",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon
                className={`size-4 ${
                  stat.highlight ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stat.highlight ? "text-primary" : ""
                }`}
              >
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
