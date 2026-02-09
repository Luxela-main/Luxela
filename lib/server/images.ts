// Server-side image parsing utility (can be called from generateMetadata)
// This is NOT a client component - it's a pure utility function

interface RawListing {
  id?: string;
  image?: string;
  images_json?: string;
  imagesJson?: string;
}

export const parseListingImages = (listing: RawListing): string[] => {
  try {
    // Try to parse imagesJson or images_json field
    const jsonField = listing.imagesJson || listing.images_json;

    if (!jsonField) {
      // Fallback to main image only
      return listing.image ? [listing.image] : [];
    }

    let parsedImages: any[] = [];
    
    if (typeof jsonField === 'string') {
      const parsed = JSON.parse(jsonField);
      if (Array.isArray(parsed)) {
        parsedImages = parsed;
      } else if (typeof parsed === 'object' && parsed.images && Array.isArray(parsed.images)) {
        parsedImages = parsed.images;
      }
    } else if (Array.isArray(jsonField)) {
      parsedImages = jsonField;
    }
    
    // Extract URLs from images, handling both string and object formats
    const imageUrls = parsedImages
      .map((img) => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img?.imageUrl) return img.imageUrl;
        if (typeof img === 'object' && img?.url) return img.url;
        return '';
      })
      .filter((url): url is string => url.length > 0);
    
    return imageUrls.length > 0 ? imageUrls : (listing.image ? [listing.image] : []);
  } catch (error) {
    console.error('Error parsing listing images:', error);
    // Return main image as fallback
    return listing.image ? [listing.image] : [];
  }
};