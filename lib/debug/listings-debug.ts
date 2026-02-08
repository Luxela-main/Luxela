/**
 * Debug utilities for listings catalog
 */

export const logListingsDebug = {
  initialized: (page: number, limit: number) => {
    console.log('%c[ListingsDebug] INITIALIZED', 'color: #0ea5e9; font-weight: bold', { page, limit });
  },
  
  catalogDataReceived: (data: any) => {
    console.log('%c[ListingsDebug] CATALOG DATA RECEIVED', 'color: #10b981; font-weight: bold', {
      listingsCount: data?.listings?.length ?? 0,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
      currentPage: data?.page ?? 0,
      hasBrandData: data?.listings?.some((l: any) => l.seller?.brandName) ?? false,
    });
  },
  
  transformationStart: (count: number) => {
    console.log('%c[ListingsDebug] TRANSFORMATION STARTED', 'color: #f59e0b; font-weight: bold', { count });
  },
  
  transformationComplete: (original: any, transformed: any) => {
    console.log('%c[ListingsDebug] TRANSFORMATION COMPLETE', 'color: #f59e0b; font-weight: bold', {
      originalCount: original?.length ?? 0,
      transformedCount: transformed?.length ?? 0,
      firstWithBrand: transformed?.[0]?.sellers?.seller_business?.[0]?.brand_name || 'MISSING',
    });
  },
  
  display: (products: any) => {
    console.log('%c[ListingsDebug] DISPLAY', 'color: #8b5cf6; font-weight: bold', {
      count: products?.length ?? 0,
      firstProduct: products?.[0] ? {
        id: products[0].id,
        title: products[0].title,
        brand: products[0].sellers?.seller_business?.[0]?.brand_name || 'NO BRAND',
      } : null,
    });
  },
  
  error: (error: any, context: string) => {
    console.error(`%c[ListingsDebug] ERROR in ${context}`, 'color: #ef4444; font-weight: bold', error);
  },
};