export type CartItemType = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type CartItemProps = {
  item: CartItemType;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  removeItem: (id: number) => void;
};
