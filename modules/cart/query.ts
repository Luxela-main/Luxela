import { api } from "@/lib/api";
import { queryClient } from "@/lib/apiClient";
import { toastSvc } from "@/services/toast";
import { useQuery, useMutation } from "@tanstack/react-query";

export const useGetCarts = () => {
  return useQuery({
    queryKey: ["carts"],
    queryFn: async () => {
      const res = await api.get("/carts");
      console.log("Carts data:", res?.data);
      return res?.data;
    },
  });
};

export const addItemstoCart = () => {
  return useMutation({
    mutationKey: ["add-item"],
    mutationFn: async (item) => {
      const res = await api.post("/carts", item);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Item added to cart successfully.");
      queryClient.invalidateQueries({ queryKey: ["carts"] });
    },
    onError: (error) => {
      toastSvc.error(`Failed to add item to cart: ${error?.message}`);
    },
  });
};
