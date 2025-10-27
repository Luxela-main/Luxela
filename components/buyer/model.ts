export interface Product {
  id: string;
  name: string;
  brand: string;
  price: string;
  currency: string;
  image: string;
  category: string;
  isLiked: boolean;
  listingId?: string;
}

export interface AddToCartRequest {
  listingId: string;
  quantity: number;
}
