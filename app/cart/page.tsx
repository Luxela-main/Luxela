import { CartProvider } from "@/modules/cart/context";
import { ListingsProvider } from "@/context/ListingsContext";
import { ProfileProvider } from "@/context/ProfileContext"; // 1. Import the missing provider
import CartPage from "@/modules/cart/page";
import BuyerHeader from "@/components/buyer/header";

const Page = () => {
  return (
    <div>
      {/* 2. Wrap everything in ProfileProvider */}
      <ProfileProvider>
        <ListingsProvider>
          <CartProvider>
            <BuyerHeader />
            <CartPage />
          </CartProvider>
        </ListingsProvider>
      </ProfileProvider>
    </div>
  );
};

export default Page;