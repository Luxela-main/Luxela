import { QueryClient, DefaultOptions } from "@tanstack/react-query";
import { toastSvc } from "@/services/toast";

const defaultOptions: DefaultOptions = {
  queries: {
    retry: false,
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({ defaultOptions });
