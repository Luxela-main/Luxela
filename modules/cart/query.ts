import { api } from "@/lib/api";
import { queryClient } from "@/lib/apiClient";
import {
  AddToCartRequest,
  ApplyDiscountRequest,
  CartResponse,
  CheckoutRequest,
  CheckoutResponse,
  UpdateCartItemRequest,
} from "./model";
import { toastSvc } from "@/services/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetCart = () => {
  const queryClient = useQueryClient();
  return useQuery<CartResponse>({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/docs/cart");
      console.log("Cart data:", res?.data);
      return res?.data;
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["add-to-cart"],
    mutationFn: async (data: AddToCartRequest) => {
      const res = await api.post("/docs/cart/add", data);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Item added to cart successfully.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Failed to add item to cart: ${error?.message}`);
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["update-cart-item"],
    mutationFn: async (data: UpdateCartItemRequest) => {
      const res = await api.patch("/docs/cart/item", data);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Cart updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Failed to update cart: ${error?.message}`);
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["remove-cart-item"],
    mutationFn: async (listingId: string) => {
      const res = await api.delete(`/docs/cart/item?listingId=${listingId}`);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Item removed from cart.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Failed to remove item: ${error?.message}`);
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["clear-cart"],
    mutationFn: async () => {
      const res = await api.delete("/docs/cart/clear");
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Cart cleared successfully.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Failed to clear cart: ${error?.message}`);
    },
  });
};

export const useApplyDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["apply-discount"],
    mutationFn: async (data: ApplyDiscountRequest) => {
      const res = await api.post("/docs/cart/discount", data);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Discount applied successfully.");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Failed to apply discount: ${error?.message}`);
    },
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckoutResponse, Error, CheckoutRequest>({
    mutationKey: ["checkout"],
    mutationFn: async (data: CheckoutRequest) => {
      const res = await api.post("/docs/checkout", data);
      return res?.data;
    },
    onSuccess: () => {
      toastSvc.success("Order placed successfully!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: Error) => {
      toastSvc.error(`Checkout failed: ${error?.message}`);
    },
  });
};
