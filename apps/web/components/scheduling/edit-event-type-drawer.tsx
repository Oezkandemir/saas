"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as React from "react";
import {
  type EventType,
  getEventType,
} from "@/actions/scheduling/event-types-actions";

import { ButtonRoot } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { EditEventTypeForm } from "./edit-event-type-form";

const Button = {
  Root: ButtonRoot,
};

const DrawerNS = {
  Root: Drawer,
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Title: DrawerTitle,
  Close: DrawerClose,
};

interface EditEventTypeDrawerProps {
  eventType: EventType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EditEventTypeDrawer({
  eventType,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: EditEventTypeDrawerProps) {
  const router = useRouter();
  const t = useTranslations("Scheduling.eventTypes");
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [currentEventType, setCurrentEventType] =
    React.useState<EventType>(eventType);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const handleSuccess = async () => {
    // Reload event type data after successful update
    const result = await getEventType(eventType.id);
    if (result.success && result.data) {
      setCurrentEventType(result.data);
    }
    router.refresh();
  };

  // Update currentEventType when eventType prop changes
  React.useEffect(() => {
    setCurrentEventType(eventType);
  }, [eventType]);

  return (
    <DrawerNS.Root open={open} onOpenChange={setOpen} direction="right">
      {trigger && <DrawerNS.Trigger asChild>{trigger}</DrawerNS.Trigger>}

      <DrawerNS.Content
        side="right"
        className="mr-2 shadow-custom-md w-[min(600px,calc(100%-16px))]"
      >
        <div className="flex flex-col h-full bg-bg-white-0">
          <DrawerNS.Header className="bg-bg-white-0 border-b border-stroke-soft-200">
            <div className="flex items-center justify-between">
              <DrawerNS.Title className="text-label-lg text-text-strong-950">
                {t("edit") || "Event Type bearbeiten"}
              </DrawerNS.Title>
              <DrawerNS.Close asChild>
                <Button.Root variant="ghost" size="icon" className="size-8">
                  <X className="size-4" />
                </Button.Root>
              </DrawerNS.Close>
            </div>
          </DrawerNS.Header>

          <DrawerNS.Body className="overflow-y-auto flex-1 bg-bg-white-0">
            <div className="p-5">
              <EditEventTypeForm
                eventType={currentEventType}
                userId={currentEventType.owner_user_id}
                onSuccess={handleSuccess}
              />
            </div>
          </DrawerNS.Body>
        </div>
      </DrawerNS.Content>
    </DrawerNS.Root>
  );
}
