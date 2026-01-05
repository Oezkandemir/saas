/**
 * Accessibility utilities and helpers
 * Provides common accessibility patterns and ARIA attributes
 */

/**
 * Generate ARIA label for form fields
 */
export function getAriaLabel(
  label: string,
  required?: boolean,
  description?: string,
): string {
  let ariaLabel = label;
  if (required) {
    ariaLabel += " (required)";
  }
  if (description) {
    ariaLabel += `. ${description}`;
  }
  return ariaLabel;
}

/**
 * Generate ARIA describedby attribute
 */
export function getAriaDescribedBy(
  descriptionId?: string,
  errorId?: string,
  helpId?: string,
): string | undefined {
  const ids = [descriptionId, errorId, helpId].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/**
 * Keyboard event handlers for common interactions
 */
export const keyboardHandlers = {
  /**
   * Handle Enter key press
   */
  onEnter: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Escape key press
   */
  onEscape: (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handler();
    }
  },

  /**
   * Handle Arrow key navigation
   */
  onArrow:
    (
      onUp?: () => void,
      onDown?: () => void,
      onLeft?: () => void,
      onRight?: () => void,
    ) =>
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onUp?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          onDown?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onLeft?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          onRight?.();
          break;
      }
    },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      element.removeEventListener("keydown", handleTab);
    };
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  },
};

/**
 * Screen reader announcements
 */
export const announce = {
  /**
   * Announce message to screen readers
   */
  toScreenReader: (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

/**
 * Common ARIA attributes for different component types
 */
export const ariaAttributes = {
  button: (props: {
    label?: string;
    expanded?: boolean;
    controls?: string;
    pressed?: boolean;
  }) => ({
    "aria-label": props.label,
    "aria-expanded": props.expanded,
    "aria-controls": props.controls,
    "aria-pressed": props.pressed,
  }),

  dialog: (props: { label?: string; describedBy?: string }) => ({
    role: "dialog",
    "aria-label": props.label,
    "aria-describedby": props.describedBy,
    "aria-modal": "true",
  }),

  form: (props: { label?: string; describedBy?: string }) => ({
    role: "form",
    "aria-label": props.label,
    "aria-describedby": props.describedBy,
  }),

  navigation: (props: { label?: string }) => ({
    role: "navigation",
    "aria-label": props.label,
  }),

  region: (props: { label?: string }) => ({
    role: "region",
    "aria-label": props.label,
  }),
};

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return element.matches(focusableSelectors);
}

/**
 * Get next focusable element
 */
export function getNextFocusable(
  container: HTMLElement,
  currentElement: HTMLElement,
): HTMLElement | null {
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );

  const currentIndex = focusableElements.indexOf(currentElement);
  return focusableElements[currentIndex + 1] || focusableElements[0] || null;
}

/**
 * Get previous focusable element
 */
export function getPreviousFocusable(
  container: HTMLElement,
  currentElement: HTMLElement,
): HTMLElement | null {
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );

  const currentIndex = focusableElements.indexOf(currentElement);
  return (
    focusableElements[currentIndex - 1] ||
    focusableElements[focusableElements.length - 1] ||
    null
  );
}

