// import { useQuery } from "@tanstack/react-query";
// import { api } from "@/lib/api";
// import { sellersKeys } from "./queryKeys";
// import { ISellerProfile } from "../model";

// export const useSellerProfile = () => {
//   return useQuery<ISellerProfile>({
//     queryKey: sellersKeys.profile(),
//     queryFn: async () => {
//       const response = await api.get("/seller/profile");
//       return response.data;
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     retry: 1,
//   });
// };



import { trpc } from "@/lib/trpc";
// import { sellersKeys } from "@/utils/queryKeys";
// import { ISellerProfile } from "@/types";
// export const useSellerProfile = (options = {}) => {
//   return trpc.seller.getProfile.useQuery(undefined, {
//     staleTime: 5 * 60 * 1000,
//     retry: false,
//     refetchOnWindowFocus: false,
//     ...options,
//   });
// };


export const useSellerProfile = () => {
  return trpc.seller.getProfile.useQuery(undefined, {
    staleTime: 0, // Always refetch on mount
    retry: 1,
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};