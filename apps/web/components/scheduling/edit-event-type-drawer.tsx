"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  getEventType,
  type EventType,
} from "@/actions/scheduling/event-types-actions";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ButtonRoot } from "@/components/alignui/actions/button";
import {
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/alignui/overlays/drawer";

import { EditEventTypeForm } from "./edit-event-type-form";

const Button = {
  Root: ButtonRoot,
};

const Drawer = {
  Root: DrawerRoot,
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
  const [currentEventType, setCurrentEventType] = React.useState<EventType>(eventType);

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
    <Drawer.Root open={open} onOpenChange={setOpen} direction="right">
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Content
        side="right"
        className="mr-2 shadow-custom-md w-[min(600px,calc(100%-16px))]"
      >
        <div className="flex flex-col h-full bg-bg-white-0">
          <Drawer.Header className="bg-bg-white-0 border-b border-stroke-soft-200">
            <div className="flex items-center justify-between">
              <Drawer.Title className="text-label-lg text-text-strong-950">
                {t("edit") || "Event Type bearbeiten"}
              </Drawer.Title>
              <Drawer.Close asChild>
                <Button.Root variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button.Root>
              </Drawer.Close>
            </div>
          </Drawer.Header>

          <Drawer.Body className="overflow-y-auto flex-1 bg-bg-white-0">
            <div className="p-5">
              <EditEventTypeForm
                eventType={currentEventType}
                userId={currentEventType.owner_user_id}
                onSuccess={handleSuccess}
              />
            </div>
          </Drawer.Body>
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
}

