"use client";

import ExploreAllProducts from './dynamic/explore-all-products';
import FeaturedBrands from './dynamic/featured-brands';
import FeaturedCollection from './dynamic/featured-collection';

const Homepage = () => {
  return (
    <section className='py-8 layout'>
      <FeaturedBrands />
      <FeaturedCollection />
      <ExploreAllProducts />
    </section>
  );
};

export default Homepage;
