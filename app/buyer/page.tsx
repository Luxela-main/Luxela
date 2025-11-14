import ExploreAllProducts from '@/components/buyer/brand/explore-all-products'
import FeaturedBrands from '@/components/buyer/featured-brands'
import FeaturedCollection from '@/components/buyer/featured-collection'
import React from 'react'

const Homepage = () => {
  return (
    <section className='py-8'>
      <FeaturedBrands />
      <FeaturedCollection />
      <ExploreAllProducts />
    </section>
  )
}

export default Homepage
