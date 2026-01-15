"use client";

import ExploreAllProducts from '@/components/buyer/explore-all-products';
import FeaturedBrands from '@/components/buyer/featured-brands';
import FeaturedCollection from '@/components/buyer/featured-collection';

const Homepage = () => {
  return (
    <section className='py-8 px-6 lg:px-10'>
      <FeaturedBrands />
      <FeaturedCollection />
      <ExploreAllProducts />
    </section>
  );
};

export default Homepage;
