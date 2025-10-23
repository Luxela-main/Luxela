import { toast } from "react-toastify";
export const toastSvc = {
  success: (msg: string) => toast.success(msg, { hideProgressBar: true }),

  error: (msg: string) => {
    if (msg === "Unauthorized") return;
    toast.error(msg, { hideProgressBar: true });
  },

  apiError: (error: any) => {
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
      toast.error(message, { hideProgressBar: true });
    }
  },
};
