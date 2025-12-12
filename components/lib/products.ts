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






export interface MasterProduct {
  id: number
  name: string
  brand: string
  brandSlug: string
  price: number
  currency: string
  images: string[]
  description?: string
  sizes?: string[]
  colors?: { id: string; hex: string }[]
  category: string
  sku?: string
  inStock?: boolean
  shipsIn?: string
}






export const MASTER_PRODUCTS: MasterProduct[] = [
  // =======================
  // From PRODUCTS_DATABASE
  // =======================

  {
    id: 1,
    name: "Baggy Jeans",
    brand: "BAZ Fashion",
    brandSlug: "baz",
    price: 0.06,
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
    ],
    description: "Classic baggy jeans with a modern twist. 100% cotton. Regular fit.",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { id: "white", hex: "#ffffff" },
      { id: "black", hex: "#0b0b0b" },
      { id: "navy", hex: "#172554" },
    ],
    category: "Denim",
    sku: "BAZ-001",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 2,
    name: "BAZ Hoodie",
    brand: "BAZ Fashion",
    brandSlug: "baz",
    price: 0.06,
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop",
    ],
    description: "Premium comfort hoodie with signature BAZ branding. Heavy weight.",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "gray", hex: "#6b7280" },
    ],
    category: "Hoodies",
    sku: "BAZ-002",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 3,
    name: "Bat Tee Black Print",
    brand: "BAZ Fashion",
    brandSlug: "baz",
    price: 0.04,
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop",
    ],
    description: "Statement tee with bold graphic print. Lightweight cotton.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "white", hex: "#ffffff" },
    ],
    category: "T-Shirts",
    sku: "BAZ-003",
    inStock: true,
    shipsIn: "1-2 days"
  },
  {
    id: 9,
    name: "Classic Loafers",
    brand: "SHU",
    brandSlug: "shu",
    price: 0.08,
    currency: "SOL",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    ],
    description: "Timeless leather loafers with slip-on comfort.",
    sizes: ["7", "8", "9", "10", "11"],
    colors: [
      { id: "black", hex: "#0b0b0b" },
      { id: "brown", hex: "#92400e" },
    ],
    category: "Shoes",
    sku: "SHU-001",
    inStock: true,
    shipsIn: "2-3 days"
  },

  // ================================
  // From BRAND_CATALOG / COLLECTIONS
  // ================================

  // ----- BAZ Fashion Extra -----
  {
    id: 4,
    name: "Valor Jacket",
    brand: "BAZ Fashion",
    brandSlug: "baz",
    price: 0.055,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop"],
    category: "Jackets",
    description: "Statement jacket for confident individuals.",
    inStock: true
  },

  // ----- HONORAH -----
  {
    id: 5,
    name: "Silk Dress",
    brand: "HONORAH",
    brandSlug: "honorah",
    price: 0.089,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Elegant silk dress crafted for refined style.",
    inStock: true
  },
  {
    id: 6,
    name: "Evening Gown",
    brand: "HONORAH",
    brandSlug: "honorah",
    price: 0.125,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Gown design for evening elegance.",
    inStock: true
  },
  {
    id: 7,
    name: "Cocktail Dress",
    brand: "HONORAH",
    brandSlug: "honorah",
    price: 0.095,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Cocktail dress for fashion-forward nights.",
    inStock: true
  },
  {
    id: 8,
    name: "Summer Dress",
    brand: "HONORAH",
    brandSlug: "honorah",
    price: 0.067,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Light and breezy summer dress.",
    inStock: true
  },
  {
    id: 55,
    name: "Chiffon Evening Dress",
    brand: "HONORAH",
    brandSlug: "honorah",
    price: 0.11,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1600180758896-84c5f78f0e32?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Elegant chiffon evening design.",
    inStock: true
  },

  // ----- RIO Jewels -----
  {
    id: 10,
    name: "Gold Hoop Earrings",
    brand: "RIO Jewels",
    brandSlug: "rio-jewels",
    price: 0.08,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Stylish gold hoop earrings.",
    inStock: true
  },
  {
    id: 11,
    name: "Silver Pendant Necklace",
    brand: "RIO Jewels",
    brandSlug: "rio-jewels",
    price: 0.09,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1556228724-4f122f4c7a68?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Elegant silver pendant.",
    inStock: true
  },
  {
    id: 12,
    name: "Diamond Stud Earrings",
    brand: "RIO Jewels",
    brandSlug: "rio-jewels",
    price: 0.12,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Classic diamond studs.",
    inStock: true
  },
  {
    id: 13,
    name: "Emerald Ring",
    brand: "RIO Jewels",
    brandSlug: "rio-jewels",
    price: 0.15,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1518546305921-92c9fa7a56c0?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Emerald gemstone ring.",
    inStock: true
  },

  // ----- LUXE Co. -----
  {
    id: 16,
    name: "Aurora Necklace",
    brand: "LUXE Co.",
    brandSlug: "luxe-co",
    price: 0.12,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Elegant aurora necklace.",
    inStock: true
  },
  {
    id: 17,
    name: "Gold Ring",
    brand: "LUXE Co.",
    brandSlug: "luxe-co",
    price: 0.10,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Classic gold ring.",
    inStock: true
  },
  {
    id: 18,
    name: "Silver Bracelet",
    brand: "LUXE Co.",
    brandSlug: "luxe-co",
    price: 0.08,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Minimalist silver bracelet.",
    inStock: true
  },
  {
    id: 19,
    name: "Emerald Earrings",
    brand: "LUXE Co.",
    brandSlug: "luxe-co",
    price: 0.15,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1593032457869-208bdf12756c?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Elegant emerald earrings.",
    inStock: true
  },

  // ----- EMBER Originals -----
  {
    id: 21,
    name: "Ember Hoodie",
    brand: "EMBER Originals",
    brandSlug: "ember-originals",
    price: 0.07,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop"],
    category: "Hoodies",
    description: "Urban streetwear hoodie.",
    inStock: true
  },
  {
    id: 22,
    name: "Ember T-Shirt",
    brand: "EMBER Originals",
    brandSlug: "ember-originals",
    price: 0.06,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=400&fit=crop"],
    category: "T-Shirts",
    description: "Signature tee.",
    inStock: true
  },
  {
    id: 23,
    name: "Ember Jacket",
    brand: "EMBER Originals",
    brandSlug: "ember-originals",
    price: 0.08,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"],
    category: "Jackets",
    description: "Comfortable urban jacket.",
    inStock: true
  },
  {
    id: 24,
    name: "Ember Pants",
    brand: "EMBER Originals",
    brandSlug: "ember-originals",
    price: 0.05,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop"],
    category: "Pants",
    description: "Comfort-fit pants.",
    inStock: true
  },

  // ----- SOLSTICE Atelier -----
  {
    id: 25,
    name: "Solstice Dress",
    brand: "SOLSTICE Atelier",
    brandSlug: "solstice-atelier",
    price: 0.14,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Artisan-crafted dress.",
    inStock: true
  },
  {
    id: 26,
    name: "Solstice Skirt",
    brand: "SOLSTICE Atelier",
    brandSlug: "solstice-atelier",
    price: 0.11,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"],
    category: "Skirts",
    description: "Elegant styled skirt.",
    inStock: true
  },
  {
    id: 27,
    name: "Solstice Blouse",
    brand: "SOLSTICE Atelier",
    brandSlug: "solstice-atelier",
    price: 0.10,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop"],
    category: "Blouses",
    description: "Artisan blouse.",
    inStock: true
  },
  {
    id: 28,
    name: "Solstice Jacket",
    brand: "SOLSTICE Atelier",
    brandSlug: "solstice-atelier",
    price: 0.12,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=400&h=400&fit=crop"],
    category: "Jackets",
    description: "Stylish jacket.",
    inStock: true
  },

  // ----- NovaWear -----
  {
    id: 29,
    name: "Nova Jacket",
    brand: "NovaWear",
    brandSlug: "novawear",
    price: 0.10,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"],
    category: "Jackets",
    description: "Urban tech jacket.",
    inStock: true
  },
  {
    id: 30,
    name: "Nova Jeans",
    brand: "NovaWear",
    brandSlug: "novawear",
    price: 0.08,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"],
    category: "Denim",
    description: "Stylish denim jeans.",
    inStock: true
  },
  {
    id: 31,
    name: "Nova T-Shirt",
    brand: "NovaWear",
    brandSlug: "novawear",
    price: 0.07,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400&h=400&fit=crop"],
    category: "T-Shirts",
    description: "Casual tee.",
    inStock: true
  },
  {
    id: 32,
    name: "Nova Hoodie",
    brand: "NovaWear",
    brandSlug: "novawear",
    price: 0.09,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"],
    category: "Hoodies",
    description: "Comfort hoodie.",
    inStock: true
  },

  // ----- Monarch Co. -----
  {
    id: 33,
    name: "Monarch Blazer",
    brand: "Monarch Co.",
    brandSlug: "monarch-co",
    price: 0.12,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=400&h=400&fit=crop"],
    category: "Blazers",
    description: "Elegant blazer.",
    inStock: true
  },
  {
    id: 34,
    name: "Monarch Dress",
    brand: "Monarch Co.",
    brandSlug: "monarch-co",
    price: 0.14,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"],
    category: "Dresses",
    description: "Statement dress.",
    inStock: true
  },
  {
    id: 35,
    name: "Monarch Shirt",
    brand: "Monarch Co.",
    brandSlug: "monarch-co",
    price: 0.06,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop"],
    category: "Shirts",
    description: "Classic shirt.",
    inStock: true
  },
  {
    id: 36,
    name: "Monarch Pants",
    brand: "Monarch Co.",
    brandSlug: "monarch-co",
    price: 0.08,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=400&h=400&fit=crop"],
    category: "Pants",
    description: "Casual pants.",
    inStock: true
  },

  // ----- Eclipse Luxe -----
  {
    id: 37,
    name: "Solaris Gold Bracelet",
    brand: "Eclipse Luxe",
    brandSlug: "eclipse-luxe",
    price: 0.20,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1516632664305-eda5bd4782ab?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Luxury gold bracelet.",
    inStock: true
  },
  {
    id: 38,
    name: "Eclipse Pendant",
    brand: "Eclipse Luxe",
    brandSlug: "eclipse-luxe",
    price: 0.18,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1520962917269-91f8a37514d1?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Elegant gold pendant.",
    inStock: true
  },
  {
    id: 39,
    name: "Celestial Gold Ring",
    brand: "Eclipse Luxe",
    brandSlug: "eclipse-luxe",
    price: 0.22,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Celestial gold ring.",
    inStock: true
  },
  {
    id: 40,
    name: "Eclipse Earrings",
    brand: "Eclipse Luxe",
    brandSlug: "eclipse-luxe",
    price: 0.19,
    currency: "SOL",
    images: ["https://images.unsplash.com/photo-1529634954857-6f1391c7a5c7?w=400&h=400&fit=crop"],
    category: "Jewelry",
    description: "Luxury earrings.",
    inStock: true
  }
]





