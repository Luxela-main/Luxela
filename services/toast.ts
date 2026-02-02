import { toast, ToastOptions } from "react-toastify";

type ExtendedToastOptions = ToastOptions & { description?: string };

export const toastSvc = {
  success: (msg: string, options?: ExtendedToastOptions) => toast.success(msg, { hideProgressBar: true, ...options }),

  error: (msg: string, options?: ExtendedToastOptions) => {
    if (msg === "Unauthorized") return;
    toast.error(msg, { hideProgressBar: true, ...options });
  },

  info: (msg: string, options?: ExtendedToastOptions) => toast.info(msg, { hideProgressBar: true, ...options }),

  warning: (msg: string, options?: ExtendedToastOptions) => toast.warning(msg, { hideProgressBar: true, ...options }),

  apiError: (error: any, options?: ExtendedToastOptions) => {
    let message = "An unexpected error occurred.";

    if (error.response?.data) {
      const data = error.response.data;
      message =
        data.message ||
        data.error ||
        (Array.isArray(data.errors) && data.errors[0]?.msg) ||
        message;
    } else if (error.message) {
      message = error.message;
    }

    if (message !== "Unauthorized") {
      toast.error(message, { hideProgressBar: true, ...options });
    }
  },
};