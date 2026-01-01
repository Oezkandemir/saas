"use client";

import { useCallback, useEffect, useRef } from "react";
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
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  screenSize: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  language: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  connectionType: string;
  isOnline: boolean;
};

type GeolocationInfo = {
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function AnalyticsTracker() {
  const { session } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const viewStartTimeRef = useRef<number | null>(null);

  // Get geolocation info via server-side API route (avoids CSP issues)
  const getGeolocationInfo = async (): Promise<GeolocationInfo> => {
    try {
      // Use server-side API route to avoid CSP issues
      const response = await fetch("/api/analytics/geolocation", {
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country || null,
          city: data.city || null,
          region: data.region || null,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        };
      }
    } catch (error) {
      // Silent fail - return defaults
      console.debug("Geolocation fetch failed:", error);
    }
    
    // Return defaults with timezone from browser
    return {
      country: null,
      city: null,
      region: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      latitude: null,
      longitude: null,
    };
  };

  // Detect browser details with enhanced information
  const getBrowserInfo = (): BrowserInfo => {
    if (typeof window === "undefined") {
      return {
        browser: "unknown",
        browserVersion: "unknown",
        os: "unknown",
        osVersion: "unknown",
        deviceType: "unknown",
        screenSize: "unknown",
        screenWidth: 0,
        screenHeight: 0,
        viewportWidth: 0,
        viewportHeight: 0,
        pixelRatio: 1,
        language: "unknown",
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        connectionType: "unknown",
        isOnline: true,
      };
    }

    const ua = window.navigator.userAgent;
    const browserInfo: BrowserInfo = {
      browser: "unknown",
      browserVersion: "unknown",
      os: "unknown",
      osVersion: "unknown",
      deviceType: "unknown",
      screenSize: `${window.screen.width}x${window.screen.height}`,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      language: navigator.language || "unknown",
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      connectionType: (navigator as any).connection?.effectiveType || "unknown",
      isOnline: navigator.onLine,
    };

    // Detect browser and version
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    const safariMatch = ua.match(/Version\/(\d+).*Safari/);
    const edgeMatch = ua.match(/Edge\/(\d+)/);

    if (chromeMatch && !ua.match(/Edg/)) {
      browserInfo.browser = "Chrome";
      browserInfo.browserVersion = chromeMatch[1];
    } else if (firefoxMatch) {
      browserInfo.browser = "Firefox";
      browserInfo.browserVersion = firefoxMatch[1];
    } else if (safariMatch && !ua.match(/Chrome/)) {
      browserInfo.browser = "Safari";
      browserInfo.browserVersion = safariMatch[1];
    } else if (edgeMatch) {
      browserInfo.browser = "Edge";
      browserInfo.browserVersion = edgeMatch[1];
    } else if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1) {
      browserInfo.browser = "IE";
      const ieMatch = ua.match(/(?:MSIE |rv:)(\d+)/);
      if (ieMatch) browserInfo.browserVersion = ieMatch[1];
    }

    // Detect OS and version
    const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/);
    const macMatch = ua.match(/Mac OS X (\d+[._]\d+)/);
    const androidMatch = ua.match(/Android (\d+\.\d+)/);
    const iosMatch = ua.match(/OS (\d+[._]\d+)/);

    if (windowsMatch) {
      browserInfo.os = "Windows";
      browserInfo.osVersion = windowsMatch[1];
    } else if (macMatch) {
      browserInfo.os = "MacOS";
      browserInfo.osVersion = macMatch[1].replace(/_/g, ".");
    } else if (androidMatch) {
      browserInfo.os = "Android";
      browserInfo.osVersion = androidMatch[1];
    } else if (iosMatch) {
      browserInfo.os = "iOS";
      browserInfo.osVersion = iosMatch[1].replace(/_/g, ".");
    } else if (ua.indexOf("Linux") !== -1) {
      browserInfo.os = "Linux";
    }

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android/i.test(ua) && !isMobile;

    browserInfo.isMobile = isMobile;
    browserInfo.isTablet = isTablet;
    browserInfo.isDesktop = !isMobile && !isTablet;
    browserInfo.deviceType = isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop";

    return browserInfo;
  };

  // Function to track page view - wrap in useCallback
  const trackPageView = useCallback(
    async (url: string, referrer: string | null) => {
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
        const geoInfo = await getGeolocationInfo();

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
            // Enhanced fields
            country: geoInfo.country,
            city: geoInfo.city,
            region: geoInfo.region,
            timezone: geoInfo.timezone,
            latitude: geoInfo.latitude,
            longitude: geoInfo.longitude,
            browserVersion: browserInfo.browserVersion,
            osVersion: browserInfo.osVersion,
            screenWidth: browserInfo.screenWidth,
            screenHeight: browserInfo.screenHeight,
            viewportWidth: browserInfo.viewportWidth,
            viewportHeight: browserInfo.viewportHeight,
            pixelRatio: browserInfo.pixelRatio,
            language: browserInfo.language,
            isMobile: browserInfo.isMobile,
            isTablet: browserInfo.isTablet,
            isDesktop: browserInfo.isDesktop,
            connectionType: browserInfo.connectionType,
            isOnline: browserInfo.isOnline,
          });
        }
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    },
    [session],
  );

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
  }, [pathname, searchParams, session, trackPageView]);

  // This component doesn't render anything
  return null;
}
