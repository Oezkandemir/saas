import { toast as sonnerToast } from "sonner";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: ToastAction;
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

/**
 * Enhanced toast functions with actions and better defaults
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      cancel: options?.cancel && options.cancel.onClick
        ? {
            label: options.cancel.label,
            onClick: options.cancel.onClick,
          }
        : undefined,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 7000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      cancel: options?.cancel && options.cancel.onClick
        ? {
            label: options.cancel.label,
            onClick: options.cancel.onClick,
          }
        : undefined,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      cancel: options?.cancel && options.cancel.onClick
        ? {
            label: options.cancel.label,
            onClick: options.cancel.onClick,
          }
        : undefined,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick,
          }
        : undefined,
      cancel: options?.cancel && options.cancel.onClick
        ? {
            label: options.cancel.label,
            onClick: options.cancel.onClick,
          }
        : undefined,
    });
  },

  /**
   * Toast with undo action
   */
  withUndo: (
    message: string,
    onUndo: () => void,
    options?: Omit<ToastOptions, "action">
  ) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: {
        label: "Rückgängig",
        onClick: onUndo,
      },
    });
  },

  /**
   * Toast with loading state that can be updated
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  /**
   * Promise toast - automatically shows loading, success, or error
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },
};

