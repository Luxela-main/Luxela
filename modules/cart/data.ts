export interface CartItemType {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export const initialCartItems: CartItemType[] = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    price: 15000,
    quantity: 2,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Classic Denim Jeans",
    price: 25000,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Leather Jacket",
    price: 45000,
    quantity: 1,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
  },
];
