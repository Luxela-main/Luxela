import fetch from 'node-fetch';

async function testTrpcEndpoint() {
  try {
    console.log('\n===== TESTING tRPC ENDPOINT =====\n');

    // Assuming the app is running on localhost:3000
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/trpc/buyerListingsCatalog.getApprovedListingsCatalog?input=${encodeURIComponent(JSON.stringify({page:1,limit:20,sortBy:'newest'}))}`;

    console.log(`Calling: ${endpoint}\n`);

    const response = await fetch(endpoint);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Endpoint successful!\n`);
      console.log(`Found ${data.result.data.listings.length} approved listings\n`);
      
      if (data.result.data.listings.length > 0) {
        console.log('📋 First listing:');
        const listing = data.result.data.listings[0];
        console.log(`   Title: ${listing.title}`);
        console.log(`   Price: ${listing.price}`);
        console.log(`   Seller: ${listing.seller.brandName}`);
      }
    } else {
      console.log(`❌ Endpoint error:\n`, data);
    }

    console.log('\n===================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nNote: Make sure the app is running on localhost:3000');
  }
}

testTrpcEndpoint();