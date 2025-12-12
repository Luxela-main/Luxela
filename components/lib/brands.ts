export const BRAND_DATA: Record<string, {
  name: string
  description: string
  heroImage: string
  logoImage: string
  category: string
}> = {
  "baz": {
    name: "BAZ Fashion",
    description: "Bold statement pieces and contemporary designs that define your style with confidence and flair.",
    heroImage: "https://images.unsplash.com/photo-1521334884684-d80222895322?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop",
    category: "Clothes & Wears"
  },
  "honorah": {
    name: "HONORAH",
    description: "HONORAH creates timeless pieces that elevate everyday moments and empower self-expression. Rooted in elegance and simplicity.",
    heroImage: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop",
    category: "Elegant Fashion"
  },
  "rio-jewels": {
    name: "RIO Jewels",
    description: "Luxury jewelry pieces that capture timeless elegance and sophistication.",
    heroImage: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1606401659345-2b07c4294f12?w=200&h=200&fit=crop",
    category: "Jewelry"
  },
  "shu": {
    name: "SHU",
    description: "Premium footwear crafted for the modern adventurer.",
    heroImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&h=200&fit=crop",
    category: "Footwear"
  },
  "luxe-co": {
    name: "LUXE Co.",
    description: "Curating exceptional experiences through premium lifestyle products that speak to the modern connoisseur's refined taste.",
    heroImage: "https://images.unsplash.com/photo-1542838687-2f805f2c094e?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=200&h=200&fit=crop",
    category: "Luxury Lifestyle"
  },
  "ember-originals": {
    name: "EMBER Originals",
    description: "Authentic craftsmanship and innovative designs for those who dare to stand out.",
    heroImage: "https://images.unsplash.com/photo-1533743983669-94fa0b5b9c1b?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1533106418989-88406c7ef164?w=200&h=200&fit=crop",
    category: "Streetwear & Urban Fashion"
  },
  "solstice-atelier": {
    name: "SOLSTICE Atelier",
    description: "Where artistry meets wearable fashion. Each piece is handcrafted to inspire and captivate.",
    heroImage: "https://images.unsplash.com/photo-1541241379607-7bcd3c0f4232?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
    category: "Artisan Fashion"
  },
  "novawear": {
    name: "NovaWear",
    description: "Futuristic designs fused with comfort and practicality for the modern wardrobe.",
    heroImage: "https://images.unsplash.com/photo-1600180758894-9de3b01ff2d6?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1581091215369-4a8d398167a1?w=200&h=200&fit=crop",
    category: "Modern Fashion"
  },
  "monarch-co": {
    name: "Monarch Co.",
    description: "Elegant and powerful pieces designed to make a statement in every setting.",
    heroImage: "https://images.unsplash.com/photo-1583221187742-3b6c98f5fd1e?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1565638366-62edc837e1de?w=200&h=200&fit=crop",
    category: "Luxury Fashion"
  },
  "eclipse-luxe": {
    name: "Eclipse Luxe",
    description: "Sophisticated designs and timeless luxury, crafted for the discerning fashion enthusiast.",
    heroImage: "https://images.unsplash.com/photo-1574367757385-9b2c21e1e05f?w=800&h=400&fit=crop",
    logoImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    category: "High-End Fashion"
  }
}




export interface Product {
  id: number
  name: string
  brand: string
  brandSlug: string
  price: number | string
  currency: string
  image: string
  category: string
  isLiked: boolean
  variants: string[]
}

export interface BrandSection {
  brandName: string
  brandSlug: string
  products: Product[]
}

export const BRAND_CATALOG: BrandSection[] = [
  // ===== BAZ FASHION =====
  {
    brandName: "BAZ Fashion",
    brandSlug: "baz",
    products: [
      { id: 1, name: "Baggy Jeans", brand: "BAZ Fashion", brandSlug: "baz", price: 45, currency: "SOL", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop", category: "Denim", isLiked: false, variants: ["blue", "black", "gray"] },
      { id: 2, name: "BAZ Hoodie", brand: "BAZ Fashion", brandSlug: "baz", price: 32, currency: "SOL", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=400&fit=crop", category: "Hoodies", isLiked: true, variants: ["white", "black", "gray"] },
      { id: 3, name: "Bat Tee Black Print", brand: "BAZ Fashion", brandSlug: "baz", price: 28, currency: "SOL", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop", category: "T-Shirts", isLiked: false, variants: ["black", "navy", "gray"] },
      { id: 4, name: "Valor Jacket", brand: "BAZ Fashion", brandSlug: "baz", price: 55, currency: "SOL", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop", category: "Jackets", isLiked: true, variants: ["black", "brown", "blue"] }
    ]
  },

  // ===== HONORAH =====
  {
    brandName: "HONORAH",
    brandSlug: "honorah",
    products: [
      { id: 5, name: "Silk Dress", brand: "HONORAH", brandSlug: "honorah", price: 89, currency: "SOL", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop", category: "Dresses", isLiked: true, variants: ["pink", "cream", "black"] },
      { id: 6, name: "Evening Gown", brand: "HONORAH", brandSlug: "honorah", price: 125, currency: "SOL", image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop", category: "Dresses", isLiked: false, variants: ["burgundy", "navy", "black"] },
      { id: 7, name: "Cocktail Dress", brand: "HONORAH", brandSlug: "honorah", price: 95, currency: "SOL", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop", category: "Dresses", isLiked: false, variants: ["red", "black", "gold"] },
      { id: 8, name: "Summer Dress", brand: "HONORAH", brandSlug: "honorah", price: 67, currency: "SOL", image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop", category: "Dresses", isLiked: true, variants: ["coral", "white", "blue"] }
    ]
  },

  // ===== RIO JEWELS =====
  {
    brandName: "RIO Jewels",
    brandSlug: "rio-jewels",
    products: [
      { id: 9, name: "Diamond Ring", brand: "RIO Jewels", brandSlug: "rio-jewels", price: 450, currency: "SOL", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=400&fit=crop", category: "Rings", isLiked: false, variants: ["gold", "silver", "rose-gold"] },
      { id: 10, name: "Luxury Watch", brand: "RIO Jewels", brandSlug: "rio-jewels", price: 280, currency: "SOL", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=400&fit=crop", category: "Watches", isLiked: true, variants: ["black", "silver", "gold"] },
      { id: 11, name: "Gold Chain", brand: "RIO Jewels", brandSlug: "rio-jewels", price: 180, currency: "SOL", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=400&fit=crop", category: "Chains", isLiked: false, variants: ["gold", "silver", "rose-gold"] },
      { id: 12, name: "Pearl Necklace", brand: "RIO Jewels", brandSlug: "rio-jewels", price: 320, currency: "SOL", image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=300&h=400&fit=crop", category: "Necklaces", isLiked: false, variants: ["white", "cream", "black"] }
    ]
  },

  // ===== SHU =====
  {
    brandName: "SHU",
    brandSlug: "shu",
    products: [
      { id: 13, name: "Leather Boots", brand: "SHU", brandSlug: "shu", price: 125, currency: "SOL", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop", category: "Boots", isLiked: true, variants: ["brown", "black", "tan"] },
      { id: 14, name: "High Heels", brand: "SHU", brandSlug: "shu", price: 89, currency: "SOL", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", category: "Heels", isLiked: false, variants: ["black", "nude", "red"] },
      { id: 15, name: "Sneakers", brand: "SHU", brandSlug: "shu", price: 95, currency: "SOL", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop", category: "Sneakers", isLiked: false, variants: ["white", "black", "gray"] },
      { id: 16, name: "Oxford Shoes", brand: "SHU", brandSlug: "shu", price: 115, currency: "SOL", image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&h=400&fit=crop", category: "Formal", isLiked: false, variants: ["brown", "black", "burgundy"] }
    ]
  },

  // ===== LUXE Co. =====
  {
    brandName: "LUXE Co.",
    brandSlug: "luxe-co",
    products: [
      { id: 17, name: "Aurora Necklace", brand: "LUXE Co.", brandSlug: "luxe-co", price: 220, currency: "SOL", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop", category: "Necklaces", isLiked: true, variants: ["gold", "silver", "rose-gold"] },
      { id: 18, name: "Ethereal Ring", brand: "LUXE Co.", brandSlug: "luxe-co", price: 150, currency: "SOL", image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=300&h=400&fit=crop", category: "Rings", isLiked: false, variants: ["gold", "silver", "platinum"] },
      { id: 19, name: "LUXE Earrings", brand: "LUXE Co.", brandSlug: "luxe-co", price: 130, currency: "SOL", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=400&fit=crop", category: "Earrings", isLiked: true, variants: ["gold", "silver", "pearl"] },
      { id: 20, name: "Aurora Bracelet", brand: "LUXE Co.", brandSlug: "luxe-co", price: 180, currency: "SOL", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop", category: "Bracelets", isLiked: false, variants: ["gold", "silver", "rose-gold"] }
    ]
  },

  // ===== EMBER Originals =====
  {
    brandName: "EMBER Originals",
    brandSlug: "ember-originals",
    products: [
      { id: 21, name: "Ember Hoodie", brand: "EMBER Originals", brandSlug: "ember-originals", price: 60, currency: "SOL", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop", category: "Hoodies", isLiked: false, variants: ["black", "gray", "white"] },
      { id: 22, name: "Ember T-Shirt", brand: "EMBER Originals", brandSlug: "ember-originals", price: 35, currency: "SOL", image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300&h=400&fit=crop", category: "T-Shirts", isLiked: true, variants: ["black", "white", "blue"] },
      { id: 23, name: "Ember Jacket", brand: "EMBER Originals", brandSlug: "ember-originals", price: 80, currency: "SOL", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", category: "Jackets", isLiked: false, variants: ["black", "brown", "blue"] },
      { id: 24, name: "Ember Pants", brand: "EMBER Originals", brandSlug: "ember-originals", price: 50, currency: "SOL", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=400&fit=crop", category: "Pants", isLiked: false, variants: ["black", "gray", "navy"] }
    ]
  },

  // ===== SOLSTICE Atelier =====
  {
    brandName: "SOLSTICE Atelier",
    brandSlug: "solstice-atelier",
    products: [
      { id: 25, name: "Solstice Dress", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: 120, currency: "SOL", image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop", category: "Dresses", isLiked: true, variants: ["blue", "white", "black"] },
      { id: 26, name: "Solstice Skirt", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: 60, currency: "SOL", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop", category: "Skirts", isLiked: false, variants: ["red", "black", "navy"] },
      { id: 27, name: "Solstice Blouse", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: 45, currency: "SOL", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop", category: "Blouses", isLiked: false, variants: ["white", "pink", "cream"] },
      { id: 28, name: "Solstice Jacket", brand: "SOLSTICE Atelier", brandSlug: "solstice-atelier", price: 85, currency: "SOL", image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop", category: "Jackets", isLiked: true, variants: ["black", "brown", "gray"] }
    ]
  },

  // ===== NovaWear =====
  {
    brandName: "NovaWear",
    brandSlug: "novawear",
    products: [
      { id: 29, name: "Nova Jacket", brand: "NovaWear", brandSlug: "novawear", price: 90, currency: "SOL", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=400&fit=crop", category: "Jackets", isLiked: false, variants: ["black", "blue", "gray"] },
      { id: 30, name: "Nova Jeans", brand: "NovaWear", brandSlug: "novawear", price: 50, currency: "SOL", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=400&fit=crop", category: "Denim", isLiked: true, variants: ["blue", "black", "gray"] },
      { id: 31, name: "Nova T-Shirt", brand: "NovaWear", brandSlug: "novawear", price: 35, currency: "SOL", image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=300&h=400&fit=crop", category: "T-Shirts", isLiked: false, variants: ["white", "black", "gray"] },
      { id: 32, name: "Nova Hoodie", brand: "NovaWear", brandSlug: "novawear", price: 60, currency: "SOL", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop", category: "Hoodies", isLiked: true, variants: ["gray", "black", "blue"] }
    ]
  },

  // ===== Monarch Co. =====
  {
    brandName: "Monarch Co.",
    brandSlug: "monarch-co",
    products: [
      { id: 33, name: "Monarch Blazer", brand: "Monarch Co.", brandSlug: "monarch-co", price: 120, currency: "SOL", image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=300&h=400&fit=crop", category: "Blazers", isLiked: true, variants: ["black", "gray", "blue"] },
      { id: 34, name: "Monarch Dress", brand: "Monarch Co.", brandSlug: "monarch-co", price: 140, currency: "SOL", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop", category: "Dresses", isLiked: false, variants: ["red", "black", "white"] },
      { id: 35, name: "Monarch Shirt", brand: "Monarch Co.", brandSlug: "monarch-co", price: 60, currency: "SOL", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop", category: "Shirts", isLiked: false, variants: ["white", "blue", "gray"] },
      { id: 36, name: "Monarch Pants", brand: "Monarch Co.", brandSlug: "monarch-co", price: 70, currency: "SOL", image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=300&h=400&fit=crop", category: "Pants", isLiked: true, variants: ["black", "gray", "blue"] }
    ]
  },

  // ===== Eclipse Luxe =====
  {
    brandName: "Eclipse Luxe",
    brandSlug: "eclipse-luxe",
    products: [
      { id: 37, name: "Eclipse Ring", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: 180, currency: "SOL", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=400&fit=crop", category: "Rings", isLiked: false, variants: ["gold", "silver", "rose-gold"] },
      { id: 38, name: "Eclipse Necklace", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: 220, currency: "SOL", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&h=400&fit=crop", category: "Necklaces", isLiked: true, variants: ["gold", "silver", "black"] },
      { id: 39, name: "Eclipse Bracelet", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: 150, currency: "SOL", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&h=400&fit=crop", category: "Bracelets", isLiked: false, variants: ["gold", "silver", "rose-gold"] },
      { id: 40, name: "Eclipse Earrings", brand: "Eclipse Luxe", brandSlug: "eclipse-luxe", price: 130, currency: "SOL", image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=300&h=400&fit=crop", category: "Earrings", isLiked: false, variants: ["gold", "silver", "black"] }
    ]
  }
]




interface CollectionProduct {
  id: number
  name: string
  brand: string
  price: number
  currency: string
  image: string
}

interface CollectionSection {
  collectionName: string
  collectionSlug: string
  brandSlug: string
  products: CollectionProduct[]
}

// Collections with their products
export const COLLECTION_CATALOG: CollectionSection[] = [
  {
    collectionName: "Wrangler Collection",
    collectionSlug: "wrangler",
    brandSlug: "baz",
    products: [
      {
        id: 1,
        name: "B/W Wrangler",
        brand: "BAZ Fashion",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400&h=400&fit=crop"
      },
      {
        id: 2,
        name: "B/W Wrangler",
        brand: "BAZ Fashion",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop"
      },
      {
        id: 3,
        name: "B/W Wrangler",
        brand: "BAZ Fashion",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"
      },
      {
        id: 4,
        name: "B/W Wrangler",
        brand: "BAZ Fashion",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=400&h=400&fit=crop"
      },
    ]
  },

  {
    collectionName: "Prime Collection",
    collectionSlug: "prime",
    brandSlug: "rio-jewels",
    products: [
      {
        id: 5,
        name: "Gold Prime Set",
        brand: "RIO Jewels",
        price: 0.12,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop"
      },
      {
        id: 6,
        name: "Diamond Necklace",
        brand: "RIO Jewels",
        price: 0.15,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1520962922320-2038eebab146?w=400&h=400&fit=crop"
      },
      {
        id: 7,
        name: "Luxury Earrings",
        brand: "RIO Jewels",
        price: 0.10,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1577041240898-41e0643f9b95?w=400&h=400&fit=crop"
      },
      {
        id: 8,
        name: "Prime Ring",
        brand: "RIO Jewels",
        price: 0.09,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1612810806563-0e580a817f52?w=400&h=400&fit=crop"
      },
    ]
  },

  {
    collectionName: "The Black Atlas Collection",
    collectionSlug: "black-atlas",
    brandSlug: "shu",
    products: [
      {
        id: 9,
        name: "Mocaships",
        brand: "SHU",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
      },
      {
        id: 10,
        name: "Chelsea Boot",
        brand: "SHU",
        price: 0.09,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"
      },
      {
        id: 11,
        name: "Loafers by Brogues",
        brand: "SHU",
        price: 0.07,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop"
      },
      {
        id: 12,
        name: "Mocaships",
        brand: "SHU",
        price: 0.08,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=400&fit=crop"
      },
    ]
  },

  {
    collectionName: "Valor Collection",
    collectionSlug: "valor",
    brandSlug: "baz",
    products: [
      {
        id: 13,
        name: "Valor Tee",
        brand: "BAZ Fashion",
        price: 0.05,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop"
      },
      {
        id: 14,
        name: "Valor Hoodie",
        brand: "BAZ Fashion",
        price: 0.07,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1520975922094-5330c7a77a45?w=400&h=400&fit=crop"
      },
      {
        id: 15,
        name: "Valor Jacket",
        brand: "BAZ Fashion",
        price: 0.09,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1554568218-0f1715ad4d57?w=400&h=400&fit=crop"
      },
      {
        id: 16,
        name: "Valor Pants",
        brand: "BAZ Fashion",
        price: 0.06,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=400&h=400&fit=crop"
      },
    ]
  },

  {
    collectionName: "Aurora Series",
    collectionSlug: "aurora",
    brandSlug: "luxe-co",
    products: [
      {
        id: 17,
        name: "Aurora Dress",
        brand: "LUXE Co.",
        price: 0.15,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop"
      },
      {
        id: 18,
        name: "Aurora Bag",
        brand: "LUXE Co.",
        price: 0.12,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1503342250614-ca440786584b?w=400&h=400&fit=crop"
      },
      {
        id: 19,
        name: "Aurora Heels",
        brand: "LUXE Co.",
        price: 0.18,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1503342301859-96f19a24a5bb?w=400&h=400&fit=crop"
      },
      {
        id: 20,
        name: "Aurora Scarf",
        brand: "LUXE Co.",
        price: 0.10,
        currency: "SOL",
        image: "https://images.unsplash.com/photo-1542219550-37153d387c86?w=400&h=400&fit=crop"
      },
      
    ]
  },

  // 6. EMBER Originals — Ember Essentials
{
  collectionName: "Ember Essentials",
  collectionSlug: "ember",
  brandSlug: "ember-originals",
  products: [
    {
      id: 21,
      name: "Ember Street Jacket",
      brand: "EMBER Originals",
      price: 0.07,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop"
    },
    {
      id: 22,
      name: "Flare Cargo Pants",
      brand: "EMBER Originals",
      price: 0.06,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=400&h=400&fit=crop"
    },
    {
      id: 23,
      name: "Urban Ember Tee",
      brand: "EMBER Originals",
      price: 0.04,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop"
    },
    {
      id: 24,
      name: "Ember Hoodie",
      brand: "EMBER Originals",
      price: 0.08,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=400&fit=crop"
    }
  ]
},

// 7. SOLSTICE Atelier — Solstice Couture
{
  collectionName: "Solstice Couture",
  collectionSlug: "solstice",
  brandSlug: "solstice-atelier",
  products: [
    {
      id: 25,
      name: "Solstice Silk Dress",
      brand: "SOLSTICE Atelier",
      price: 0.14,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1520975897724-6c5d65be7810?w=400&h=400&fit=crop"
    },
    {
      id: 26,
      name: "Pastel Flow Gown",
      brand: "SOLSTICE Atelier",
      price: 0.16,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1542060748-10c28b62716f?w=400&h=400&fit=crop"
    },
    {
      id: 27,
      name: "Solstice Velvet Wrap",
      brand: "SOLSTICE Atelier",
      price: 0.11,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"
    },
    {
      id: 28,
      name: "Couture Satin Top",
      brand: "SOLSTICE Atelier",
      price: 0.09,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1564859228273-03d4a6c24f9b?w=400&h=400&fit=crop"
    }
  ]
},

// 8. NovaWear — Urban Nova Series
{
  collectionName: "Urban Nova Series",
  collectionSlug: "urban-nova",
  brandSlug: "novawear",
  products: [
    {
      id: 29,
      name: "Nova Tech Jacket",
      brand: "NovaWear",
      price: 0.10,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop"
    },
    {
      id: 30,
      name: "Urban Performance Pants",
      brand: "NovaWear",
      price: 0.08,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=400&fit=crop"
    },
    {
      id: 31,
      name: "Nova Hybrid Sneakers",
      brand: "NovaWear",
      price: 0.12,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop"
    },
    {
      id: 32,
      name: "Tech Core Hoodie",
      brand: "NovaWear",
      price: 0.07,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=400&fit=crop"
    }
  ]
},

// 9. Monarch Co. — Monarch Leather Series
{
  collectionName: "Monarch Leather Series",
  collectionSlug: "monarch",
  brandSlug: "monarch-co",
  products: [
    {
      id: 33,
      name: "Monarch Leather Tote",
      brand: "Monarch Co.",
      price: 0.15,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1535043205849-513fe27db3c5?w=400&h=400&fit=crop"
    },
    {
      id: 34,
      name: "Royal Stitch Wallet",
      brand: "Monarch Co.",
      price: 0.06,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1590879148462-08cda8e3f53b?w=400&h=400&fit=crop"
    },
    {
      id: 35,
      name: "Monarch Leather Belt",
      brand: "Monarch Co.",
      price: 0.05,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1526170068061-1537e1f1b682?w=400&h=400&fit=crop"
    },
    {
      id: 36,
      name: "Emperor Satchel",
      brand: "Monarch Co.",
      price: 0.14,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop"
    }
  ]
},

// 10. Eclipse Luxe — Eclipse Gold Line
{
  collectionName: "Eclipse Gold Line",
  collectionSlug: "eclipse",
  brandSlug: "eclipse-luxe",
  products: [
    {
      id: 37,
      name: "Solaris Gold Bracelet",
      brand: "Eclipse Luxe",
      price: 0.20,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1516632664305-eda5bd4782ab?w=400&h=400&fit=crop"
    },
    {
      id: 38,
      name: "Eclipse Pendant",
      brand: "Eclipse Luxe",
      price: 0.18,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1520962917269-91f8a37514d1?w=400&h=400&fit=crop"
    },
    {
      id: 39,
      name: "Celestial Gold Ring",
      brand: "Eclipse Luxe",
      price: 0.22,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"
    },
    {
      id: 40,
      name: "Aurora Gold Earrings",
      brand: "Eclipse Luxe",
      price: 0.19,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1529634954857-6f1391c7a5c7?w=400&h=400&fit=crop"
    }
  ]
},

{
  collectionName: "Crystal Collection",
  collectionSlug: "honorah",
  brandSlug: "honorah",
  products: [
    {
      id: 5,
      name: "Silk Dress",
      brand: "HONORAH",
      price: 0.12,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop"
    },
    {
      id: 6,
      name: "Evening Gown",
      brand: "HONORAH",
      price: 0.15,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1566479179817-2c1a5b31b6e8?w=400&h=400&fit=crop"
    },
    {
      id: 7,
      name: "Cocktail Dress",
      brand: "HONORAH",
      price: 0.10,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop"
    },
    {
      id: 8,
      name: "Summer Dress",
      brand: "HONORAH",
      price: 0.09,
      currency: "SOL",
      image: "https://images.unsplash.com/photo-1549062572-544a64fb0c56?w=400&h=400&fit=crop"
    }
  ]
},

];