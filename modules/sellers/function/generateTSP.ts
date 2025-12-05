import helper from "@/helper";

export const generateTopSellingProducts = (listings: any[], sales: any[]) => {
  const productSales: { [key: string]: { sales: number; listing: any } } = {};

  sales.forEach((sale) => {
    const listingId = sale.listingId;
    if (!productSales[listingId]) {
      const listing = listings.find((l) => l.id === listingId);
      if (listing) {
        productSales[listingId] = { sales: 0, listing };
      }
    }
    if (productSales[listingId]) {
      productSales[listingId].sales += 1;
    }
  });

  return Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(({ sales, listing }) => ({
      id: listing.id,
      name: listing.title,
      category: listing.category || "Unknown",
      price: helper.toCurrency((listing.priceCents || 0) / 100),
      quantitySold: sales,
      status:
        (listing.quantityAvailable || 0) > 10
          ? ("In stock" as const)
          : (listing.quantityAvailable || 0) > 0
          ? ("Low stock" as const)
          : ("Sold out" as const),
    }));
};
