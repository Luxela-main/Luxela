/**
 * Payment Customer Helper
 * 
 * DEPRECATED: Customer creation has been removed.
 * Tsara automatically creates customers when payment links are created.
 * 
 * This file is kept for backwards compatibility only.
 * Do not use these functions - they will not work.
 */

console.warn(
  '[Payment Customer Helper] This module has been deprecated. ' +
  'Tsara automatically creates customers when payment links are created. ' +
  'Do not attempt to manually create customers.'
);

// Placeholder export to maintain backwards compatibility
export async function getOrCreateTsaraCustomer(buyerId: string): Promise<never> {
  throw new Error(
    'Customer creation has been removed. Tsara handles customer creation automatically. ' +
    'Pass customer email/info via payment link metadata instead.'
  );
}