"use client";

interface OrderSummaryProps {
  cartItems: readonly {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
}

export default function OrderSummary({ cartItems }: OrderSummaryProps) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 pb-4 border-b border-gray-700">
            {item.image && (
              <div className="w-16 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {item.name}
              </h4>
              <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                NGN {(item.price * item.quantity).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                NGN {item.price.toLocaleString()} each
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-lg font-bold text-white">
            NGN {subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
