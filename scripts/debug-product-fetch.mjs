#!/usr/bin/env node

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const trpc = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});

async function test() {
  try {
    console.log('\n=== Testing Product Fetch ===\n');

    // Get first approved product
    const catalogResponse = await trpc.buyerListingsCatalog.getApprovedListingsCatalog.query({
      page: 1,
      limit: 1,
    });

    console.log('📦 Catalog Response:');
    if (catalogResponse.listings && catalogResponse.listings.length > 0) {
      const product = catalogResponse.listings[0];
      console.log(`  Product: ${product.title}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Primary Image: ${product.image ? '✅' : '❌'}`);
      console.log(`  imagesJson raw: ${product.imagesJson ? `(${product.imagesJson.length} chars)` : 'null'}`);
      
      if (product.imagesJson) {
        try {
          const parsed = JSON.parse(product.imagesJson);
          console.log(`  Parsed images count: ${Array.isArray(parsed) ? parsed.length : 'not array'}`);
          if (Array.isArray(parsed)) {
            console.log(`  First 2 images: ${parsed.slice(0, 2).map(img => typeof img === 'string' ? img.substring(0, 50) : JSON.stringify(img).substring(0, 50)).join(', ')}`);
          }
        } catch (e) {
          console.log(`  ❌ Failed to parse imagesJson: ${e.message}`);
        }
      }

      // Now test getListingById
      console.log(`\n🔍 Testing getListingById for product: ${product.id}\n`);
      const detailResponse = await trpc.buyerListingsCatalog.getListingById.query({
        listingId: product.id,
      });

      console.log('📄 Detail Response:');
      console.log(`  Title: ${detailResponse.title}`);
      console.log(`  Primary Image: ${detailResponse.image ? '✅' : '❌'}`);
      console.log(`  imagesJson raw: ${detailResponse.imagesJson ? `(${detailResponse.imagesJson.length} chars)` : 'null'}`);

      if (detailResponse.imagesJson) {
        try {
          const parsed = JSON.parse(detailResponse.imagesJson);
          console.log(`  Parsed images count: ${Array.isArray(parsed) ? parsed.length : 'not array'}`);
          if (Array.isArray(parsed)) {
            console.log(`  First 2 images:\n    ${parsed.slice(0, 2).join('\n    ')}`);
          }
        } catch (e) {
          console.log(`  ❌ Failed to parse imagesJson: ${e.message}`);
        }
      }

      console.log('\n✅ Test complete');
    } else {
      console.log('❌ No products found in catalog');
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

test();