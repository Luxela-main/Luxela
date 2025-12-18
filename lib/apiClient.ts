import { QueryClient, DefaultOptions } from "@tanstack/react-query";
import { toastSvc } from "@/services/toast";

const defaultOptions: DefaultOptions = {
  queries: {
    retry: false,
    onError: (error: any) => toastSvc.apiError(error),
  },
  mutations: {
    retry: false,
    onError: (error: any) => toastSvc.apiError(error),
  },
};

export const queryClient = new QueryClient({ defaultOptions });
