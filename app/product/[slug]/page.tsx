import { ProductSchema } from "./ProductSchema";

// TODO: replace with your actual DB call
async function getProduct(slug: string) {
  // temporary demo product (replace with real database fetch)
  return {
    name: "Demo Product Name",
    slug,
    price: 15000,
    inStock: true,
    images: ["https://theluxela.com/demo.jpg"],
    shortDescription: "A stylish and trendy outfit available at Luxela.",
    sku: "LX-12345",
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  return (
    <div className="px-4 py-6">
      <ProductSchema product={product} />

      <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
      <p className="text-gray-700 mb-4">{product.shortDescription}</p>
      <p className="font-semibold text-lg">₦ {product.price}</p>

      <img
        src={product.images[0]}
        alt={product.name}
        className="w-full max-w-md rounded-lg mt-6"
      />
    </div>
  );
}