import React from "react";
import {
  deleteAllNotifications,
  deleteNotification,
  getUserNotifications,
} from "@/actions/user-profile-actions";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClearAllNotificationsButton } from "@/components/profile/clear-all-notifications-button";
import { DeleteNotificationButton } from "@/components/profile/delete-notification-button";

// Mock the dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/actions/user-profile-actions", () => ({
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
  getUserNotifications: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Notification Delete Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (deleteNotification as any).mockResolvedValue({
      success: true,
      data: null,
    });
    (deleteAllNotifications as any).mockResolvedValue({
      success: true,
      data: null,
    });
  });

  describe("DeleteNotificationButton", () => {
    it("renders the delete button correctly", () => {
      render(<DeleteNotificationButton notificationId="test-id" />);
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("calls deleteNotification when clicked", async () => {
      render(<DeleteNotificationButton notificationId="test-id" />);

      // Click the delete button
      fireEvent.click(screen.getByText("Delete"));

      // Check if the function was called with the correct ID
      await waitFor(() => {
        expect(deleteNotification).toHaveBeenCalledWith("test-id");
      });
    });

    it("shows error state when the API call fails", async () => {
      // Mock the API to fail
      (deleteNotification as any).mockRejectedValueOnce(
        new Error("Test error"),
      );

      render(<DeleteNotificationButton notificationId="test-id" />);

      // Click the delete button
      fireEvent.click(screen.getByText("Delete"));

      // Wait for the error state
      await waitFor(() => {
        expect(deleteNotification).toHaveBeenCalledWith("test-id");
      });
    });
  });

  describe("ClearAllNotificationsButton", () => {
    it("renders the clear all button correctly", () => {
      render(<ClearAllNotificationsButton />);
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("calls deleteAllNotifications when clicked", async () => {
      render(<ClearAllNotificationsButton />);

      // Click the clear all button
      fireEvent.click(screen.getByText("Clear All"));

      // Check if the function was called
      await waitFor(() => {
        expect(deleteAllNotifications).toHaveBeenCalled();
      });
    });

    it("shows error state when the API call fails", async () => {
      // Mock the API to fail
      (deleteAllNotifications as any).mockRejectedValueOnce(
        new Error("Test error"),
      );

      render(<ClearAllNotificationsButton />);

      // Click the clear all button
      fireEvent.click(screen.getByText("Clear All"));

      // Wait for the error state
      await waitFor(() => {
        expect(deleteAllNotifications).toHaveBeenCalled();
      });
    });
  });
});
