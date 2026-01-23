'use client';

import { CartProvider } from "@/modules/cart/context";
import { ListingsProvider } from "@/context/ListingsContext";
import { ProfileProvider } from "@/context/ProfileContext";
import CartPage from "@/modules/cart/page";
import BuyerHeader from "@/components/buyer/header";
import { Suspense } from 'react';

const Page = () => {
  return (
    <div>
      <ProfileProvider>
        <ListingsProvider>
          <CartProvider>
            <Suspense fallback={<div className="h-16 bg-gray-200" />}>
              <BuyerHeader />
            </Suspense>
            <CartPage />
          </CartProvider>
        </ListingsProvider>
      </ProfileProvider>
    </div>
  );
};

export default Page;