import React from "react";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
} from "@/actions/user-profile-actions";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationsPopover } from "@/components/shared/notifications-popover";

// Mock the dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey, queryFn, enabled }) => {
    if (
      queryKey[0] === "notifications" &&
      queryKey[1] === "popover" &&
      enabled
    ) {
      return {
        data: mockNotifications,
        isLoading: false,
        refetch: vi.fn().mockResolvedValue(null),
      };
    }
    return {
      data: [],
      isLoading: false,
      refetch: vi.fn().mockResolvedValue(null),
    };
  },
}));

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: vi.fn().mockReturnValue({
    unreadCount: 3,
    isLoading: false,
    refetch: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock("@/actions/user-profile-actions", () => ({
  getUserNotifications: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock notifications data
const mockNotifications = [
  {
    id: "1",
    user_id: "user-1",
    title: "Welcome",
    content: "Welcome to our platform!",
    type: "WELCOME",
    read: false,
    action_url: "/dashboard",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user-1",
    title: "Payment reminder",
    content: "Your payment is due soon",
    type: "BILLING",
    read: true,
    action_url: "/billing",
    created_at: new Date().toISOString(),
  },
];

describe("NotificationsPopover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
    });
    (markAllNotificationsAsRead as any).mockResolvedValue({
      success: true,
    });
  });

  it("renders the trigger correctly", () => {
    render(
      <NotificationsPopover>
        <button>Test Trigger</button>
      </NotificationsPopover>,
    );

    expect(screen.getByText("Test Trigger")).toBeInTheDocument();
  });

  it("opens the popover when clicking the trigger", async () => {
    render(
      <NotificationsPopover>
        <button>Test Trigger</button>
      </NotificationsPopover>,
    );

    // Initially the content should not be visible
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();

    // Click the trigger
    fireEvent.click(screen.getByText("Test Trigger"));

    // The content should now be visible
    await waitFor(() => {
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });
  });

  it("shows notification items when there are notifications", async () => {
    render(
      <NotificationsPopover>
        <button>Test Trigger</button>
      </NotificationsPopover>,
    );

    // Open the popover
    fireEvent.click(screen.getByText("Test Trigger"));

    // Should show notification titles
    await waitFor(() => {
      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Payment reminder")).toBeInTheDocument();
    });
  });

  it("shows the 'Mark all as read' button when there are unread notifications", async () => {
    render(
      <NotificationsPopover>
        <button>Test Trigger</button>
      </NotificationsPopover>,
    );

    // Open the popover
    fireEvent.click(screen.getByText("Test Trigger"));

    // Should show the Mark all as read button
    await waitFor(() => {
      expect(screen.getByText("Mark all as read")).toBeInTheDocument();
    });
  });

  it("calls markAllNotificationsAsRead when clicking the 'Mark all as read' button", async () => {
    render(
      <NotificationsPopover>
        <button>Test Trigger</button>
      </NotificationsPopover>,
    );

    // Open the popover
    fireEvent.click(screen.getByText("Test Trigger"));

    // Click the Mark all as read button
    await waitFor(() => {
      fireEvent.click(screen.getByText("Mark all as read"));
    });

    // Check if the function was called
    await waitFor(() => {
      expect(markAllNotificationsAsRead).toHaveBeenCalled();
    });
  });
});
