"use client";

import { useSearch } from '@/context/SearchContext';
import { useListings } from '@/context/ListingsContext';
import { useMemo } from 'react';
import ExploreAllProducts from '@/components/buyer/explore-all-products';
import FeaturedBrands from '@/components/buyer/featured-brands';
import FeaturedCollection from '@/components/buyer/featured-collection';
import { SearchX } from 'lucide-react';

const Homepage = () => {
  const { searchQuery } = useSearch();
  const { listings } = useListings();

  // Check if any results exist across all sections
  const hasResults = useMemo(() => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Check brands
    const hasBrands = listings.some(listing => {
      const business = listing.sellers?.seller_business?.[0];
      return business?.brand_name?.toLowerCase().includes(query) ||
             business?.store_description?.toLowerCase().includes(query);
    });

    // Check collections
    const hasCollections = listings.some(listing => {
      if (listing.type !== 'collection') return false;
      
      if (listing.title?.toLowerCase().includes(query)) return true;
      
      const brandName = listing.sellers?.seller_business?.[0]?.brand_name;
      if (brandName?.toLowerCase().includes(query)) return true;

      let items: any[] = [];
      try {
        items = listing.items_json ? JSON.parse(listing.items_json) : [];
      } catch (e) {}

      return items.some(item => 
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    });

    // Check products
    const hasProducts = listings.some(listing => {
      if (listing.type !== 'single') return false;
      
      return listing.title?.toLowerCase().includes(query) ||
             listing.description?.toLowerCase().includes(query) ||
             listing.category?.toLowerCase().includes(query) ||
             listing.sellers?.seller_business?.[0]?.brand_name?.toLowerCase().includes(query);
    });

    return hasBrands || hasCollections || hasProducts;
  }, [listings, searchQuery]);

  return (
    <section className='py-8'>
      {/* No results message */}
      {searchQuery && !hasResults ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <SearchX strokeWidth={1} className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              No results found
            </h3>
            <p className="text-gray-400 mb-1">
              We couldn't find anything matching "{searchQuery}"
            </p>
            <p className="text-gray-500 text-sm">
              Try searching by brand name, product name, or collection name
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Pass searchQuery to each component */}
          <FeaturedBrands searchQuery={searchQuery} />
          <FeaturedCollection searchQuery={searchQuery} />
          <ExploreAllProducts searchQuery={searchQuery} />
        </>
      )}
    </section>
  );
};

export default Homepage;