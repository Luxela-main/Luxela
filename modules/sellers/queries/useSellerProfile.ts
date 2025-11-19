import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sellersKeys } from "./queryKeys";
import { ISellerProfile } from "../model";

export const useSellerProfile = () => {
  return useQuery<ISellerProfile>({
    queryKey: sellersKeys.profile(),
    queryFn: async () => {
      const response = await api.get("/seller/profile");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
