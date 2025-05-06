"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  recordPageView,
  trackUserInteraction,
  type PageViewData,
  type UserInteractionData,
} from "@/actions/analytics-actions";
import { v4 as uuidv4 } from "uuid";

import { useSupabase } from "@/components/supabase-provider";

// Type to store browser details
type BrowserInfo = {
  browser: string;
  os: string;
  deviceType: string;
  screenSize: string;
};

export function AnalyticsTracker() {
  const { session } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const viewStartTimeRef = useRef<number | null>(null);

  // Detect browser details
  const getBrowserInfo = (): BrowserInfo => {
    if (typeof window === "undefined") {
      return {
        browser: "unknown",
        os: "unknown",
        deviceType: "unknown",
        screenSize: "unknown",
      };
    }

    const ua = window.navigator.userAgent;
    const browserInfo: BrowserInfo = {
      browser: "unknown",
      os: "unknown",
      deviceType: "unknown",
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    };

    // Detect browser
    if (ua.indexOf("Chrome") !== -1) browserInfo.browser = "Chrome";
    else if (ua.indexOf("Safari") !== -1) browserInfo.browser = "Safari";
    else if (ua.indexOf("Firefox") !== -1) browserInfo.browser = "Firefox";
    else if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1)
      browserInfo.browser = "IE";
    else if (ua.indexOf("Edge") !== -1) browserInfo.browser = "Edge";

    // Detect OS
    if (ua.indexOf("Windows") !== -1) browserInfo.os = "Windows";
    else if (ua.indexOf("Mac") !== -1) browserInfo.os = "MacOS";
    else if (ua.indexOf("Linux") !== -1) browserInfo.os = "Linux";
    else if (ua.indexOf("Android") !== -1) browserInfo.os = "Android";
    else if (ua.indexOf("iOS") !== -1) browserInfo.os = "iOS";

    // Detect device type
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    ) {
      browserInfo.deviceType = "Mobile";
    } else {
      browserInfo.deviceType = "Desktop";
    }

    return browserInfo;
  };

  // Function to track page view
  const trackPageView = async (url: string, referrer: string | null) => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = uuidv4();
    }

    // Calculate time spent on previous page
    let duration: number | null = null;
    if (viewStartTimeRef.current !== null) {
      duration = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
    }
    viewStartTimeRef.current = Date.now();

    try {
      const browserInfo = getBrowserInfo();
      const userId = session?.user?.id;
      const pageTitle = document.title;

      if (sessionIdRef.current) {
        await recordPageView({
          userId: userId || null,
          sessionId: sessionIdRef.current,
          pagePath: url,
          pageTitle,
          referrer: referrer || null,
          duration: duration,
          browser: browserInfo.browser,
          os: browserInfo.os,
          deviceType: browserInfo.deviceType,
          screenSize: browserInfo.screenSize,
        });
      }
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  };

  // Set up global click tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (!target || !sessionIdRef.current) return;

      // Extract information about the clicked element
      const elementId = target.id || "";
      const elementClasses = Array.from(target.classList).join(" ");
      const elementText = target.textContent?.trim().substring(0, 100) || "";

      // Only track clicks on interactive elements or elements with IDs
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("a") ||
        elementId
      ) {
        try {
          await trackUserInteraction({
            userId: session?.user?.id || null,
            sessionId: sessionIdRef.current,
            pagePath: pathname || "",
            interactionType: "click",
            elementId: elementId,
            elementClass: elementClasses,
            elementText: elementText,
          });
        } catch (error) {
          console.error("Error tracking click:", error);
        }
      }
    };

    // Add click event listener
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [session, pathname]);

  // Track form submissions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSubmit = async (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form || !sessionIdRef.current) return;

      // Get form data
      const formData = new FormData(form);
      const formEntries: Record<string, string> = {};

      // Extract form field names (but not values for privacy)
      Array.from(formData.entries()).forEach(([key]) => {
        formEntries[key.toString()] = "[REDACTED]"; // Don't store actual values for privacy
      });

      try {
        await trackUserInteraction({
          userId: session?.user?.id || null,
          sessionId: sessionIdRef.current,
          pagePath: pathname || "",
          interactionType: "form_submit",
          elementId: form.id || "",
          elementClass: Array.from(form.classList).join(" "),
          formData: formEntries,
        });
      } catch (error) {
        console.error("Error tracking form submission:", error);
      }
    };

    // Add submit event listeners to all forms
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", handleSubmit);
    });

    return () => {
      forms.forEach((form) => {
        form.removeEventListener("submit", handleSubmit);
      });
    };
  }, [session, pathname]);

  // Track page navigation
  useEffect(() => {
    if (!pathname) return;

    const currentPath = pathname + (searchParams ? `?${searchParams}` : "");
    const referrer = prevPathRef.current;

    // Track the page view
    trackPageView(currentPath, referrer);

    // Update previous path for next navigation
    prevPathRef.current = currentPath;

    // Record the start time for this page view
    viewStartTimeRef.current = Date.now();

    // Cleanup function - track the time spent on the final page visit
    return () => {
      if (viewStartTimeRef.current !== null) {
        const duration = Math.floor(
          (Date.now() - viewStartTimeRef.current) / 1000,
        );
        viewStartTimeRef.current = null;

        // We don't await this since we're in a cleanup function
        if (sessionIdRef.current && duration > 0) {
          recordPageView({
            userId: session?.user?.id || null,
            sessionId: sessionIdRef.current,
            pagePath: currentPath,
            duration: duration,
            // We don't need other fields for the final update
          }).catch(console.error);
        }
      }
    };
  }, [pathname, searchParams, session]);

  // This component doesn't render anything
  return null;
}
