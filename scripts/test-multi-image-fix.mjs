async function testMultiImageDisplay() {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  console.log('🧪 Testing Multi-Image Display Fix\n');
  console.log(`📍 API Base: ${baseUrl}`);
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Get catalog list (should have imagesJson)
    console.log('📌 Test 1: Fetching catalog list...');
    const catalogResponse = await fetch(
      `${baseUrl}/api/trpc/buyerListingsCatalog.getApprovedListingsCatalog?input=${encodeURIComponent(
        JSON.stringify({ page: 1, limit: 5 })
      )}`
    );

    if (!catalogResponse.ok) {
      throw new Error(`HTTP ${catalogResponse.status}: ${await catalogResponse.text()}`);
    }

    const catalogData = await catalogResponse.json();

    if (!catalogData.result || !Array.isArray(catalogData.result.data.listings)) {
      console.error('❌ Invalid response structure from getApprovedListingsCatalog');
      console.log(catalogData);
      return;
    }

    const products = catalogData.result.data.listings;
    console.log(`✅ Retrieved ${products.length} products\n`);

    if (products.length === 0) {
      console.log('⚠️  No products in catalog. Please add products first.');
      return;
    }

    // Find a product with multiple images
    const testProduct = products.find(p => {
      if (p.imagesJson) {
        try {
          const images = JSON.parse(p.imagesJson);
          return images.length > 1;
        } catch (e) {
          return false;
        }
      }
      return false;
    }) || products[0];

    console.log('📊 Sample Product from Catalog:');
    console.log(`  - ID: ${testProduct.id}`);
    console.log(`  - Title: ${testProduct.title}`);
    console.log(`  - Primary Image: ${testProduct.image ? '✅' : '❌'}`);
    console.log(`  - ImagesJson: ${testProduct.imagesJson ? '✅' : '❌'}`);

    if (testProduct.imagesJson) {
      try {
        const images = JSON.parse(testProduct.imagesJson);
        console.log(`  - Image Count: ${images.length}`);
        console.log(`  - Images: ${images.slice(0, 2).map((img, i) => `[${i + 1}]`).join(' ')}`);
      } catch (e) {
        console.log(`  - Image Parsing: ❌ Failed`);
      }
    }

    // Test 2: Get individual listing by ID (new endpoint)
    console.log('\n📌 Test 2: Fetching individual listing by ID...');
    const listingResponse = await fetch(
      `${baseUrl}/api/trpc/buyerListingsCatalog.getListingById?input=${encodeURIComponent(
        JSON.stringify({ listingId: testProduct.id })
      )}`
    );

    if (!listingResponse.ok) {
      throw new Error(`HTTP ${listingResponse.status}: ${await listingResponse.text()}`);
    }

    const listingData = await listingResponse.json();

    if (!listingData.result || !listingData.result.data) {
      console.error('❌ Invalid response structure from getListingById');
      console.log(listingData);
      return;
    }

    const detail = listingData.result.data;
    console.log(`✅ Successfully fetched listing details\n`);

    console.log('📊 Detailed Product Info:');
    console.log(`  - ID: ${detail.id}`);
    console.log(`  - Title: ${detail.title}`);
    console.log(`  - Primary Image: ${detail.image ? '✅' : '❌'}`);
    console.log(`  - ImagesJson: ${detail.imagesJson ? '✅' : '❌'}`);

    if (detail.imagesJson) {
      try {
        const images = JSON.parse(detail.imagesJson);
        console.log(`  - Image Count: ${images.length}`);
        console.log(`  - Image URLs:`);
        images.forEach((img, i) => {
          const url = typeof img === 'string' ? img : img.imageUrl || img.url;
          const preview = url.substring(0, 60) + (url.length > 60 ? '...' : '');
          console.log(`    [${i + 1}] ${preview}`);
        });
      } catch (e) {
        console.log(`  - Image Parsing: ❌ Failed - ${e.message}`);
      }
    }

    // Comparison
    console.log('\n📈 Comparison (Catalog vs Detail):');

    let catalogImageCount = 0;
    if (testProduct.imagesJson) {
      try {
        catalogImageCount = JSON.parse(testProduct.imagesJson).length;
      } catch (e) {}
    }

    let detailImageCount = 0;
    if (detail.imagesJson) {
      try {
        detailImageCount = JSON.parse(detail.imagesJson).length;
      } catch (e) {}
    }

    console.log(`  - Catalog images: ${catalogImageCount}`);
    console.log(`  - Detail images: ${detailImageCount}`);
    console.log(`  - Match: ${catalogImageCount === detailImageCount ? '✅' : '⚠️'}`);

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (detailImageCount > 1) {
      console.log('✅ PASS: Multi-image support is working correctly!');
      console.log(`   Product shows ${detailImageCount} images in detail view.`);
    } else if (detailImageCount === 1) {
      console.log('⚠️  PARTIAL: Product has only 1 image');
      console.log('   If this is a test product, ensure it has multiple images uploaded.');
    } else {
      console.log('❌ FAIL: No images found in detail view');
      console.log('   Multi-image support may not be working properly.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMultiImageDisplay();