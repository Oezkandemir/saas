"use client";

import Link from "next/link";
import { Customer } from "@/actions/customers-actions";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Edit, FileText, Mail, Phone, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Activity {
  id: string;
  type: "document" | "email" | "phone" | "edit" | "created";
  title: string;
  description?: string;
  date: string;
  link?: string;
}

interface CustomerActivityTimelineProps {
  customer: Customer;
  documents: Array<{
    id: string;
    document_number: string;
    type: "quote" | "invoice";
    status: string;
    created_at: string;
  }>;
}

export function CustomerActivityTimeline({
  customer,
  documents,
}: CustomerActivityTimelineProps) {
  const t = useTranslations("Customers.activity");
  const tTypes = useTranslations("Customers.activity.types");
  const locale = useLocale();
  const dateLocale = locale === "de" ? de : enUS;

  const activities: Activity[] = [
    {
      id: "created",
      type: "created" as const,
      title: t("created"),
      date: customer.created_at,
    },
    ...documents.map((doc) => ({
      id: doc.id,
      type: "document" as const,
      title: t("documentCreated", {
        type: doc.type === "quote" ? tTypes("quote") : tTypes("invoice"),
        number: doc.document_number,
      }),
      description: t("status", { status: doc.status }),
      date: doc.created_at,
      link: `/dashboard/documents/${doc.id}`,
    })),
    ...(customer.updated_at !== customer.created_at
      ? [
          {
            id: "updated",
            type: "edit" as const,
            title: t("updated"),
            date: customer.updated_at,
          },
        ]
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "created":
        return <Plus className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "document":
        return "bg-blue-500";
      case "email":
        return "bg-green-500";
      case "phone":
        return "bg-purple-500";
      case "edit":
        return "bg-orange-500";
      case "created":
        return "bg-primary";
      default:
        return "bg-gray-500";
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("titleWithCount", { count: activities.length })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex gap-4">
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background ${getActivityColor(
                    activity.type,
                  )} text-white`}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    {activity.link ? (
                      <Link
                        href={activity.link}
                        className="text-sm font-medium hover:underline"
                      >
                        {activity.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{activity.title}</p>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.date), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
