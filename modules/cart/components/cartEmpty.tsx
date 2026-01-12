import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CartEmptyState = () => {
  const router = useRouter();
  return (
    <div>
      <div className="max-h-screen h-auto bg-black text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mb-6">
            <Image
              src="/empty-cart.png"
              alt="Empty cart"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>

          <h2 className="text-lg font-semibold mb-2">
            Oops! Your cart is empty.
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Go to the product page to add items to your cart
          </p>

          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md"
            onClick={() => router.push("/buyer")}>
            Add items to cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartEmptyState;
