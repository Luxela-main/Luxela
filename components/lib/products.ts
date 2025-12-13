export interface Product {
  id: number
  name: string
  brand: string
  brandSlug: string
  price: string
  currency: string
  image: string
  category: string
  isLiked: boolean
}

export const PRODUCTS: Product[] = [
  // ===== BAZ Fashion =====
  { id: 1, name: "Baggy Jeans", brand: "BAZ Fashion", brandSlug: "baz", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop", category: "Denim", isLiked: false },
  { id: 2, name: "BAZ Hoodie", brand: "BAZ Fashion", brandSlug: "baz", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop", category: "Hoodies", isLiked: true },
  { id: 3, name: "Bat Tee Black Print", brand: "BAZ Fashion", brandSlug: "baz", price: "0.04", currency: "SOL", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop", category: "T-Shirts", isLiked: false },
  { id: 4, name: "Track Pants", brand: "BAZ Fashion", brandSlug: "baz", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop", category: "Pants", isLiked: true },
  { id: 5, name: "Cargo Pants", brand: "BAZ Fashion", brandSlug: "baz", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=400&fit=crop", category: "Pants", isLiked: false },

  // ===== RIO Jewels =====
  { id: 6, name: "Gold Hoop Earrings", brand: "RIO Jewels", brandSlug: "rio-jewels", price: "0.08", currency: "SOL", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 7, name: "Silver Pendant Necklace", brand: "RIO Jewels", brandSlug: "rio-jewels", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1556228724-4f122f4c7a68?w=300&h=400&fit=crop", category: "Jewelry", isLiked: true },
  { id: 8, name: "Diamond Stud Earrings", brand: "RIO Jewels", brandSlug: "rio-jewels", price: "0.12", currency: "SOL", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 9, name: "Emerald Ring", brand: "RIO Jewels", brandSlug: "rio-jewels", price: "0.15", currency: "SOL", image: "https://images.unsplash.com/photo-1518546305921-92c9fa7a56c0?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 10, name: "Gold Bracelet", brand: "RIO Jewels", brandSlug: "rio-jewels", price: "0.10", currency: "SOL", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=300&h=400&fit=crop", category: "Jewelry", isLiked: true },

  // ===== SHU =====
  { id: 11, name: "Classic Loafers", brand: "SHU", brandSlug: "shu", price: "0.08", currency: "SOL", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop", category: "Shoes", isLiked: false },
  { id: 12, name: "Chelsea Boots", brand: "SHU", brandSlug: "shu", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop", category: "Boots", isLiked: false },
  { id: 13, name: "Derby Shoes", brand: "SHU", brandSlug: "shu", price: "0.07", currency: "SOL", image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=300&h=400&fit=crop", category: "Shoes", isLiked: false },
  { id: 14, name: "Sneakers", brand: "SHU", brandSlug: "shu", price: "0.05", currency: "SOL", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=400&fit=crop", category: "Sneakers", isLiked: true },
  { id: 15, name: "Monk Strap Shoes", brand: "SHU", brandSlug: "shu", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop", category: "Shoes", isLiked: false },

  // ===== LUXE Co. =====
  { id: 16, name: "Aurora Necklace", brand: "LUXE Co.", brandSlug: "luxe-co", price: "0.12", currency: "SOL", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop", category: "Jewelry", isLiked: true },
  { id: 17, name: "Gold Ring", brand: "LUXE Co.", brandSlug: "luxe-co", price: "0.10", currency: "SOL", image: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 18, name: "Silver Bracelet", brand: "LUXE Co.", brandSlug: "luxe-co", price: "0.08", currency: "SOL", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 19, name: "Emerald Earrings", brand: "LUXE Co.", brandSlug: "luxe-co", price: "0.15", currency: "SOL", image: "https://images.unsplash.com/photo-1593032457869-208bdf12756c?w=300&h=400&fit=crop", category: "Jewelry", isLiked: true },
  { id: 20, name: "Pearl Pendant", brand: "LUXE Co.", brandSlug: "luxe-co", price: "0.11", currency: "SOL", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },

  // ===== EMBER Originals =====
  { id: 21, name: "Ember Street Jacket", brand: "EMBER Originals", brandSlug: "ember-originals", price: "0.07", currency: "SOL", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=400&fit=crop", category: "Outerwear", isLiked: true },
  { id: 22, name: "Flare Cargo Pants", brand: "EMBER Originals", brandSlug: "ember-originals", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=300&h=400&fit=crop", category: "Pants", isLiked: false },
  { id: 23, name: "Urban Ember Tee", brand: "EMBER Originals", brandSlug: "ember-originals", price: "0.04", currency: "SOL", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=400&fit=crop", category: "T-Shirts", isLiked: false },
  { id: 24, name: "Ember Hoodie", brand: "EMBER Originals", brandSlug: "ember-originals", price: "0.08", currency: "SOL", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&h=400&fit=crop", category: "Hoodies", isLiked: true },
  { id: 25, name: "Street Cargo Jacket", brand: "EMBER Originals", brandSlug: "ember-originals", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=400&fit=crop", category: "Outerwear", isLiked: false },

  // ===== SOLSTICE Atelier =====
  { id: 26, name: "Solstice Silk Dress", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: "0.14", currency: "SOL", image: "https://images.unsplash.com/photo-1520975897724-6c5d65be7810?w=300&h=400&fit=crop", category: "Dresses", isLiked: false },
  { id: 27, name: "Pastel Flow Gown", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: "0.16", currency: "SOL", image: "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=300&h=400&fit=crop", category: "Dresses", isLiked: true },
  { id: 28, name: "Solstice Velvet Wrap", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: "0.11", currency: "SOL", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop", category: "Outerwear", isLiked: false },
  { id: 29, name: "Couture Satin Top", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1564859228273-03d4a6c24f9b?w=300&h=400&fit=crop", category: "Tops", isLiked: true },
  { id: 30, name: "Solstice Silk Blouse", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: "0.10", currency: "SOL", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop", category: "Tops", isLiked: false },

  // ===== NovaWear =====
  { id: 31, name: "Nova Tech Jacket", brand: "NovaWear", brandSlug: "novawear", price: "0.10", currency: "SOL", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&h=400&fit=crop", category: "Outerwear", isLiked: false },
  { id: 32, name: "Urban Performance Pants", brand: "NovaWear", brandSlug: "novawear", price: "0.08", currency: "SOL", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&h=400&fit=crop", category: "Pants", isLiked: true },
  { id: 33, name: "Nova Hybrid Sneakers", brand: "NovaWear", brandSlug: "novawear", price: "0.12", currency: "SOL", image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=400&fit=crop", category: "Shoes", isLiked: false },
  { id: 34, name: "Tech Core Hoodie", brand: "NovaWear", brandSlug: "novawear", price: "0.07", currency: "SOL", image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=300&h=400&fit=crop", category: "Hoodies", isLiked: false },
  { id: 35, name: "Nova Track Pants", brand: "NovaWear", brandSlug: "novawear", price: "0.09", currency: "SOL", image: "https://images.unsplash.com/photo-1526170068061-1537e1f1b682?w=300&h=400&fit=crop", category: "Pants", isLiked: true },

  // ===== Monarch Co. =====
  { id: 36, name: "Monarch Leather Tote", brand: "Monarch Co.", brandSlug: "monarch-co", price: "0.15", currency: "SOL", image: "https://images.unsplash.com/photo-1535043205849-513fe27db3c5?w=300&h=400&fit=crop", category: "Bags", isLiked: false },
  { id: 37, name: "Royal Stitch Wallet", brand: "Monarch Co.", brandSlug: "monarch-co", price: "0.06", currency: "SOL", image: "https://images.unsplash.com/photo-1590879148462-08cda8e3f53b?w=300&h=400&fit=crop", category: "Accessories", isLiked: false },
  { id: 38, name: "Monarch Leather Belt", brand: "Monarch Co.", brandSlug: "monarch-co", price: "0.05", currency: "SOL", image: "https://images.unsplash.com/photo-1526170068061-1537e1f1b682?w=300&h=400&fit=crop", category: "Accessories", isLiked: true },
  { id: 39, name: "Emperor Satchel", brand: "Monarch Co.", brandSlug: "monarch-co", price: "0.14", currency: "SOL", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=400&fit=crop", category: "Bags", isLiked: false },
  { id: 40, name: "Monarch Backpack", brand: "Monarch Co.", brandSlug: "monarch-co", price: "0.16", currency: "SOL", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", category: "Bags", isLiked: true },

  // ===== Eclipse Luxe =====
  { id: 41, name: "Solaris Gold Bracelet", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: "0.20", currency: "SOL", image: "https://images.unsplash.com/photo-1516632664305-eda5bd4782ab?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 42, name: "Eclipse Pendant", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: "0.18", currency: "SOL", image: "https://images.unsplash.com/photo-1520962917269-91f8a37514d1?w=300&h=400&fit=crop", category: "Jewelry", isLiked: true },
  { id: 43, name: "Celestial Gold Ring", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: "0.22", currency: "SOL", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false },
  { id: 44, name: "Aurora Gold Earrings", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: "0.19", currency: "SOL", image: "https://images.unsplash.com/photo-1529634954857-6f1391c7a5c7?w=300&h=400&fit=crop", category: "Jewelry", isLiked: false},


  // ===== HONORAH =====
{
  id: 51,
  name: "Silk Dress",
  brand: "HONORAH",
  brandSlug: "honorah",
  price: "89",
  currency: "SOL",
  image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop",
  category: "Dresses",
  isLiked: true,
},
{
  id: 52,
  name: "Evening Gown",
  brand: "HONORAH",
  brandSlug: "honorah",
  price: "125",
  currency: "SOL",
  image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop",
  category: "Dresses",
  isLiked: false,
},
{
  id: 53,
  name: "Cocktail Dress",
  brand: "HONORAH",
  brandSlug: "honorah",
  price: "95",
  currency: "SOL",
  image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop",
  category: "Dresses",
  isLiked: false,
},
{
  id: 54,
  name: "Summer Dress",
  brand: "HONORAH",
  brandSlug: "honorah",
  price: "67",
  currency: "SOL",
  image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop",
  category: "Dresses",
  isLiked: true,
},
{
  id: 55,
  name: "Chiffon Evening Dress",
  brand: "HONORAH",
  brandSlug: "honorah",
  price: "110",
  currency: "SOL",
  image: "https://images.unsplash.com/photo-1600180758896-84c5f78f0e32?w=300&h=400&fit=crop",
  category: "Dresses",
  isLiked: false,
}

  


]


















// ===========================
// MASTER DATA STRUCTURE
// Single source of truth for all products, brands, and collections
// ===========================

// ----- TYPES & INTERFACES -----

export interface Brand {
  id: string
  name: string
  slug: string
  description: string
  heroImage: string
  logoImage: string
  category: string
}

export interface Collection {
  id: string
  brandId: string
  name: string
  slug: string
  description?: string
  image?: string
}

export interface ProductVariant {
  id: string
  color: string
  image?: string
  quantityAvailable: number
}

export interface MasterProduct {
  id: string
  brandId: string
  name: string
  description?: string
  priceCents: number // Store price in cents to avoid floating point issues
  currency: string
  images: string[]
  category: string
  variants: ProductVariant[]
  quantityAvailable: number
  isActive: boolean
}

export interface ProductCollection {
  productId: string
  collectionId: string
}

// ----- BRANDS -----

export const BRANDS: Brand[] = [
  {
    id: "brand_1",
    name: "BAZ Fashion",
    slug: "baz",
    description: "Bold statement pieces and contemporary designs that define your style with confidence and flair.",
    heroImage: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop",
    category: "Clothes & Wears"
  },
  {
    id: "brand_2",
    name: "HONORAH",
    slug: "honorah",
    description: "HONORAH creates timeless pieces that elevate everyday moments and empower self-expression. Rooted in elegance and simplicity.",
    heroImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop",
    category: "Elegant Fashion"
  },
  {
    id: "brand_3",
    name: "RIO Jewels",
    slug: "rio-jewels",
    description: "Luxury jewelry pieces that capture timeless elegance and sophistication.",
    heroImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1606401659345-2b07c4294f12?w=200&h=200&fit=crop",
    category: "Jewelry"
  },
  {
    id: "brand_4",
    name: "SHU",
    slug: "shu",
    description: "Premium footwear crafted for the modern adventurer.",
    heroImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&h=200&fit=crop",
    category: "Footwear"
  },
  {
    id: "brand_5",
    name: "LUXE Co.",
    slug: "luxe-co",
    description: "Curating exceptional experiences through premium lifestyle products that speak to the modern connoisseur's refined taste.",
    heroImage: "https://images.unsplash.com/photo-1542838687-2f805f2c094e?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=200&h=200&fit=crop",
    category: "Luxury Lifestyle"
  },
  {
    id: "brand_6",
    name: "EMBER Originals",
    slug: "ember-originals",
    description: "Authentic craftsmanship and innovative designs for those who dare to stand out.",
    heroImage: "https://images.unsplash.com/photo-1533743983669-94fa0b5b9c1b?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1533106418989-88406c7ef164?w=200&h=200&fit=crop",
    category: "Streetwear & Urban Fashion"
  },
  {
    id: "brand_7",
    name: "SOLSTICE Atelier",
    slug: "solstice-atelier",
    description: "Where artistry meets wearable fashion. Each piece is handcrafted to inspire and captivate.",
    heroImage: "https://images.unsplash.com/photo-1541241379607-7bcd3c0f4232?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
    category: "Artisan Fashion"
  },
  {
    id: "brand_8",
    name: "NovaWear",
    slug: "novawear",
    description: "Futuristic designs fused with comfort and practicality for the modern wardrobe.",
    heroImage: "https://images.unsplash.com/photo-1600180758894-9de3b01ff2d6?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1581091215369-4a8d398167a1?w=200&h=200&fit=crop",
    category: "Modern Fashion"
  },
  {
    id: "brand_9",
    name: "Monarch Co.",
    slug: "monarch-co",
    description: "Elegant and powerful pieces designed to make a statement in every setting.",
    heroImage: "https://images.unsplash.com/photo-1583221187742-3b6c98f5fd1e?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1565638366-62edc837e1de?w=200&h=200&fit=crop",
    category: "Luxury Fashion"
  },
  {
    id: "brand_10",
    name: "Eclipse Luxe",
    slug: "eclipse-luxe",
    description: "Sophisticated designs and timeless luxury, crafted for the discerning fashion enthusiast.",
    heroImage: "https://images.unsplash.com/photo-1574367757385-9b2c21e1e05f?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    category: "High-End Fashion"
  }
]

// ----- COLLECTIONS -----

export const COLLECTIONS: Collection[] = [
  {
    id: "col_1",
    brandId: "brand_1",
    name: "Wrangler Collection",
    slug: "wrangler",
    description: "Classic denim styles reimagined for the modern wardrobe"
  },
  {
    id: "col_2",
    brandId: "brand_1",
    name: "Valor Collection",
    slug: "valor",
    description: "Bold pieces that make a statement"
  },
  {
    id: "col_3",
    brandId: "brand_2",
    name: "Crystal Collection",
    slug: "crystal",
    description: "Elegant dresses for every occasion"
  },
  {
    id: "col_4",
    brandId: "brand_3",
    name: "Prime Collection",
    slug: "prime",
    description: "Our finest luxury jewelry pieces"
  },
  {
    id: "col_5",
    brandId: "brand_4",
    name: "The Black Atlas Collection",
    slug: "black-atlas",
    description: "Premium leather footwear collection"
  },
  {
    id: "col_6",
    brandId: "brand_5",
    name: "Aurora Series",
    slug: "aurora",
    description: "Luxurious accessories that illuminate your style"
  },
  {
    id: "col_7",
    brandId: "brand_6",
    name: "Ember Essentials",
    slug: "ember-essentials",
    description: "Urban streetwear essentials"
  },
  {
    id: "col_8",
    brandId: "brand_7",
    name: "Solstice Couture",
    slug: "solstice-couture",
    description: "Handcrafted haute couture"
  },
  {
    id: "col_9",
    brandId: "brand_8",
    name: "Urban Nova Series",
    slug: "urban-nova",
    description: "Tech-inspired modern wear"
  },
  {
    id: "col_10",
    brandId: "brand_9",
    name: "Monarch Leather Series",
    slug: "monarch-leather",
    description: "Premium leather goods"
  },
  {
    id: "col_11",
    brandId: "brand_10",
    name: "Eclipse Gold Line",
    slug: "eclipse-gold",
    description: "Exquisite gold jewelry"
  }
]

// ----- MASTER PRODUCTS (Single source of truth) -----

export const MASTER_PRODUCTS: MasterProduct[] = [
  // BAZ Fashion Products
  {
    id: "prod_1",
    brandId: "brand_1",
    name: "Baggy Jeans",
    priceCents: 4500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop"],
    category: "Denim",
    variants: [
      { id: "var_1_1", color: "blue", quantityAvailable: 10 },
      { id: "var_1_2", color: "black", quantityAvailable: 8 },
      { id: "var_1_3", color: "gray", quantityAvailable: 5 }
    ],
    quantityAvailable: 23,
    isActive: true
  },
  {
    id: "prod_2",
    brandId: "brand_1",
    name: "BAZ Hoodie",
    priceCents: 3200,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop"],
    category: "Hoodies",
    variants: [
      { id: "var_2_1", color: "white", quantityAvailable: 12 },
      { id: "var_2_2", color: "black", quantityAvailable: 15 },
      { id: "var_2_3", color: "gray", quantityAvailable: 7 }
    ],
    quantityAvailable: 34,
    isActive: true
  },
  {
    id: "prod_3",
    brandId: "brand_1",
    name: "Bat Tee Black Print",
    priceCents: 2800,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop"],
    category: "T-Shirts",
    variants: [
      { id: "var_3_1", color: "black", quantityAvailable: 20 },
      { id: "var_3_2", color: "navy", quantityAvailable: 15 },
      { id: "var_3_3", color: "gray", quantityAvailable: 10 }
    ],
    quantityAvailable: 45,
    isActive: true
  },
  {
    id: "prod_4",
    brandId: "brand_1",
    name: "Valor Jacket",
    priceCents: 5500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop"],
    category: "Jackets",
    variants: [
      { id: "var_4_1", color: "black", quantityAvailable: 8 },
      { id: "var_4_2", color: "brown", quantityAvailable: 6 },
      { id: "var_4_3", color: "blue", quantityAvailable: 5 }
    ],
    quantityAvailable: 19,
    isActive: true
  },
  {
    id: "prod_5",
    brandId: "brand_1",
    name: "Track Pants",
    priceCents: 600,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop"],
    category: "Pants",
    variants: [
      { id: "var_5_1", color: "black", quantityAvailable: 15 },
      { id: "var_5_2", color: "gray", quantityAvailable: 10 }
    ],
    quantityAvailable: 25,
    isActive: true
  },
  {
    id: "prod_6",
    brandId: "brand_1",
    name: "Cargo Pants",
    priceCents: 600,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=400&fit=crop"],
    category: "Pants",
    variants: [
      { id: "var_6_1", color: "olive", quantityAvailable: 12 },
      { id: "var_6_2", color: "black", quantityAvailable: 10 }
    ],
    quantityAvailable: 22,
    isActive: true
  },

  // HONORAH Products
  {
    id: "prod_7",
    brandId: "brand_2",
    name: "Silk Dress",
    priceCents: 8900,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop"],
    category: "Dresses",
    variants: [
      { id: "var_7_1", color: "pink", quantityAvailable: 5 },
      { id: "var_7_2", color: "cream", quantityAvailable: 4 },
      { id: "var_7_3", color: "black", quantityAvailable: 6 }
    ],
    quantityAvailable: 15,
    isActive: true
  },
  {
    id: "prod_8",
    brandId: "brand_2",
    name: "Evening Gown",
    priceCents: 12500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop"],
    category: "Dresses",
    variants: [
      { id: "var_8_1", color: "burgundy", quantityAvailable: 3 },
      { id: "var_8_2", color: "navy", quantityAvailable: 4 },
      { id: "var_8_3", color: "black", quantityAvailable: 5 }
    ],
    quantityAvailable: 12,
    isActive: true
  },
  {
    id: "prod_9",
    brandId: "brand_2",
    name: "Cocktail Dress",
    priceCents: 9500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop"],
    category: "Dresses",
    variants: [
      { id: "var_9_1", color: "red", quantityAvailable: 6 },
      { id: "var_9_2", color: "black", quantityAvailable: 7 },
      { id: "var_9_3", color: "gold", quantityAvailable: 4 }
    ],
    quantityAvailable: 17,
    isActive: true
  },
  {
    id: "prod_10",
    brandId: "brand_2",
    name: "Summer Dress",
    priceCents: 6700,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop"],
    category: "Dresses",
    variants: [
      { id: "var_10_1", color: "coral", quantityAvailable: 8 },
      { id: "var_10_2", color: "white", quantityAvailable: 10 },
      { id: "var_10_3", color: "blue", quantityAvailable: 7 }
    ],
    quantityAvailable: 25,
    isActive: true
  },
  {
    id: "prod_11",
    brandId: "brand_2",
    name: "Chiffon Evening Dress",
    priceCents: 11000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1600180758896-84c5f78f0e32?w=300&h=400&fit=crop"],
    category: "Dresses",
    variants: [
      { id: "var_11_1", color: "lavender", quantityAvailable: 5 },
      { id: "var_11_2", color: "champagne", quantityAvailable: 4 }
    ],
    quantityAvailable: 9,
    isActive: true
  },

  // RIO Jewels Products
  {
    id: "prod_12",
    brandId: "brand_3",
    name: "Diamond Ring",
    priceCents: 45000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=400&fit=crop"],
    category: "Rings",
    variants: [
      { id: "var_12_1", color: "gold", quantityAvailable: 3 },
      { id: "var_12_2", color: "silver", quantityAvailable: 2 },
      { id: "var_12_3", color: "rose-gold", quantityAvailable: 2 }
    ],
    quantityAvailable: 7,
    isActive: true
  },
  {
    id: "prod_13",
    brandId: "brand_3",
    name: "Luxury Watch",
    priceCents: 28000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=400&fit=crop"],
    category: "Watches",
    variants: [
      { id: "var_13_1", color: "black", quantityAvailable: 5 },
      { id: "var_13_2", color: "silver", quantityAvailable: 4 },
      { id: "var_13_3", color: "gold", quantityAvailable: 3 }
    ],
    quantityAvailable: 12,
    isActive: true
  },
  {
    id: "prod_14",
    brandId: "brand_3",
    name: "Gold Chain",
    priceCents: 18000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=400&fit=crop"],
    category: "Chains",
    variants: [
      { id: "var_14_1", color: "gold", quantityAvailable: 8 },
      { id: "var_14_2", color: "silver", quantityAvailable: 6 },
      { id: "var_14_3", color: "rose-gold", quantityAvailable: 4 }
    ],
    quantityAvailable: 18,
    isActive: true
  },
  {
    id: "prod_15",
    brandId: "brand_3",
    name: "Pearl Necklace",
    priceCents: 32000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=300&h=400&fit=crop"],
    category: "Necklaces",
    variants: [
      { id: "var_15_1", color: "white", quantityAvailable: 5 },
      { id: "var_15_2", color: "cream", quantityAvailable: 3 },
      { id: "var_15_3", color: "black", quantityAvailable: 2 }
    ],
    quantityAvailable: 10,
    isActive: true
  },
  {
    id: "prod_16",
    brandId: "brand_3",
    name: "Gold Hoop Earrings",
    priceCents: 800,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=400&fit=crop"],
    category: "Jewelry",
    variants: [
      { id: "var_16_1", color: "gold", quantityAvailable: 15 }
    ],
    quantityAvailable: 15,
    isActive: true
  },
  {
    id: "prod_17",
    brandId: "brand_3",
    name: "Silver Pendant Necklace",
    priceCents: 900,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1556228724-4f122f4c7a68?w=300&h=400&fit=crop"],
    category: "Jewelry",
    variants: [
      { id: "var_17_1", color: "silver", quantityAvailable: 12 }
    ],
    quantityAvailable: 12,
    isActive: true
  },
  {
    id: "prod_18",
    brandId: "brand_3",
    name: "Diamond Stud Earrings",
    priceCents: 1200,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=300&h=400&fit=crop"],
    category: "Jewelry",
    variants: [
      { id: "var_18_1", color: "silver", quantityAvailable: 8 }
    ],
    quantityAvailable: 8,
    isActive: true
  },
  {
    id: "prod_19",
    brandId: "brand_3",
    name: "Emerald Ring",
    priceCents: 1500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1518546305921-92c9fa7a56c0?w=300&h=400&fit=crop"],
    category: "Jewelry",
    variants: [
      { id: "var_19_1", color: "gold", quantityAvailable: 5 }
    ],
    quantityAvailable: 5,
    isActive: true
  },
  {
    id: "prod_20",
    brandId: "brand_3",
    name: "Gold Bracelet",
    priceCents: 1000,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=300&h=400&fit=crop"],
    category: "Jewelry",
    variants: [
      { id: "var_20_1", color: "gold", quantityAvailable: 10 }
    ],
    quantityAvailable: 10,
    isActive: true
  },

  // SHU Products
  {
    id: "prod_21",
    brandId: "brand_4",
    name: "Leather Boots",
    priceCents: 12500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop"],
    category: "Boots",
    variants: [
      { id: "var_21_1", color: "brown", quantityAvailable: 8 },
      { id: "var_21_2", color: "black", quantityAvailable: 10 },
      { id: "var_21_3", color: "tan", quantityAvailable: 5 }
    ],
    quantityAvailable: 23,
    isActive: true
  },
  {
    id: "prod_22",
    brandId: "brand_4",
    name: "High Heels",
    priceCents: 8900,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop"],
    category: "Heels",
    variants: [
      { id: "var_22_1", color: "black", quantityAvailable: 12 },
      { id: "var_22_2", color: "nude", quantityAvailable: 8 },
      { id: "var_22_3", color: "red", quantityAvailable: 6 }
    ],
    quantityAvailable: 26,
    isActive: true
  },
  {
    id: "prod_23",
    brandId: "brand_4",
    name: "Sneakers",
    priceCents: 9500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop"],
    category: "Sneakers",
    variants: [
      { id: "var_23_1", color: "white", quantityAvailable: 15 },
      { id: "var_23_2", color: "black", quantityAvailable: 12 },
      { id: "var_23_3", color: "gray", quantityAvailable: 8 }
    ],
    quantityAvailable: 35,
    isActive: true
  },
  {
    id: "prod_24",
    brandId: "brand_4",
    name: "Oxford Shoes",
    priceCents: 11500,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop"],
    category: "Formal",
    variants: [
      { id: "var_24_1", color: "brown", quantityAvailable: 7 },
      { id: "var_24_2", color: "black", quantityAvailable: 9 },
      { id: "var_24_3", color: "burgundy", quantityAvailable: 4 }
    ],
    quantityAvailable: 20,
    isActive: true
  },
  {
    id: "prod_25",
    brandId: "brand_4",
    name: "Classic Loafers",
    priceCents: 800,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop"],
    category: "Shoes",
    variants: [
      { id: "var_25_1", color: "brown", quantityAvailable: 10 }
    ],
    quantityAvailable: 10,
    isActive: true
  },
  {
    id: "prod_26",
    brandId: "brand_4",
    name: "Chelsea Boots",
    priceCents: 900,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop"],
    category: "Boots",
    variants: [
      { id: "var_26_1", color: "black", quantityAvailable: 12 }
    ],
    quantityAvailable: 12,
    isActive: true
  },
  {
    id: "prod_27",
    brandId: "brand_4",
    name: "Derby Shoes",
    priceCents: 700,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=300&h=400&fit=crop"],
    category: "Shoes",
    variants: [
      { id: "var_27_1", color: "brown", quantityAvailable: 8 }
    ],
    quantityAvailable: 8,
    isActive: true
  },
  {
    id: "prod_28",
    brandId: "brand_4",
    name: "Monk Strap Shoes",
    priceCents: 900,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop"],
    category: "Shoes",
    variants: [
      { id: "var_28_1", color: "brown", quantityAvailable: 6 }
    ],
    quantityAvailable: 6,
    isActive: true
  },

]