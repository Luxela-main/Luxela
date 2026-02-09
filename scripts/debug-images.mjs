import fetch from 'node-fetch';

async function debugImages() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/trpc/buyerListingsCatalog.getApprovedListingsCatalog?input=${encodeURIComponent(JSON.stringify({page:1,limit:5,sortBy:'newest'}))}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (response.ok && data.result.data.listings.length > 0) {
      console.log('\n===== IMAGE DEBUGGING =====\n');
      
      data.result.data.listings.forEach((listing, idx) => {
        console.log(`\nProduct ${idx + 1}: ${listing.title}`);
        console.log(`  ID: ${listing.id}`);
        console.log(`  Image field: ${listing.image ? '✓ Present' : '✗ Missing'}`);
        console.log(`  ImagesJson field: ${listing.imagesJson ? '✓ Present' : '✗ Missing'}`);
        
        if (listing.imagesJson) {
          try {
            const images = JSON.parse(listing.imagesJson);
            console.log(`  Parsed Images: ${Array.isArray(images) ? images.length : '1'} image(s)`);
            if (Array.isArray(images) && images.length > 1) {
              console.log(`    ✓ MULTIPLE IMAGES DETECTED (${images.length})`);
              images.slice(0, 3).forEach((img, i) => {
                const url = typeof img === 'string' ? img : img.imageUrl || img.url;
                console.log(`      [${i}] ${url.substring(0, 60)}...`);
              });
              if (images.length > 3) {
                console.log(`      ... and ${images.length - 3} more`);
              }
            } else {
              console.log(`    Single image`);
            }
          } catch (e) {
            console.log(`  ✗ Failed to parse imagesJson: ${e.message}`);
          }
        }
      });
      
      console.log('\n=============================\n');
    } else {
      console.log('Error:', data);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugImages();