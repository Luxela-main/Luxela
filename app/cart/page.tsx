import { CartProvider } from "@/modules/cart/context";
import CartPage from "@/modules/cart/page";
import React from "react";

const Page = () => {
  return (
    <div>
      <CartProvider>
        <CartPage />
      </CartProvider>
    </div>
  );
};

export default Page;
