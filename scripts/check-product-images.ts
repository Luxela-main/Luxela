#!/usr/bin/env node

import 'dotenv/config';
import { db } from '../server/db/client';
import { listings, productImages } from '../server/db/schema';
import { eq } from 'drizzle-orm';

async function checkImages() {
  console.log('\n========================================');
  console.log('Checking Product Images in Database');
  console.log('========================================\n');

  try {
    // Get first 10 approved listings
    const approvedListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        image: listings.image,
        imagesJson: listings.imagesJson,
        productId: listings.productId,
      })
      .from(listings)
      .where(eq(listings.status, 'approved'))
      .limit(10);

    console.log(`Found ${approvedListings.length} approved listings\n`);

    for (const listing of approvedListings) {
      console.log('\n--- Listing ---');
      console.log('ID:', listing.id);
      console.log('Title:', listing.title);
      console.log('Primary Image:', listing.image);
      console.log('ImagesJson:', listing.imagesJson ? `${listing.imagesJson.substring(0, 100)}...` : 'NULL');
      console.log('Product ID:', listing.productId);

      // Check productImages table
      if (listing.productId) {
        const images = await db
          .select({
            imageUrl: productImages.imageUrl,
            position: productImages.position,
          })
          .from(productImages)
          .where(eq(productImages.productId, listing.productId));

        console.log('Images in productImages table:', images.length);
        if (images.length > 0) {
          images.forEach((img, idx) => {
            console.log(`  [${idx + 1}] ${img.imageUrl}`);
          });
        } else {
          console.log('  ⚠️ No images in productImages table');
        }
      } else {
        console.log('⚠️ No productId assigned');
      }
    }

    console.log('\n========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImages();