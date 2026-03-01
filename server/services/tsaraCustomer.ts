import { tsaraApi, TsaraResponse } from './tsara';
import { db } from '../db';
import { buyers } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export async function createCustomer(data: {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}): Promise<TsaraResponse<Customer>> {
  try {
    console.log('[Tsara] Sending customer creation request:', JSON.stringify(data, null, 2));
    
    const response = await tsaraApi.post("/customers", data);
    
    // Log the FULL response for debugging
    console.log('[Tsara] Full API Response:', JSON.stringify(response, null, 2));
    console.log('[Tsara] Response status:', response.status);
    console.log('[Tsara] Response headers:', response.headers);
    
    if (!response.data) {
      console.error("[Tsara] Empty response from create customer API");
      throw new Error("No response data from Tsara API");
    }
    
    // Check if response has error flag
    if (response.data.success === false) {
      console.error("[Tsara] API returned error:", response.data.error);
      throw new Error(response.data.error?.message || "Tsara API returned error");
    }
    
    // The response structure might be nested
    const customerData = response.data.data || response.data;
    console.log('[Tsara] Extracted customer data:', JSON.stringify(customerData, null, 2));
    
    if (!customerData || !customerData.id) {
      console.error('[Tsara] No customer ID found in response:', customerData);
      throw new Error('Tsara API did not return a valid customer ID');
    }
    
    console.log("[Tsara] Create customer response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("[Tsara] Create customer failed:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      requestData: data,
      fullError: error.toString(),
    });
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to create customer");
  }
}

export async function getCustomer(customerId: string): Promise<TsaraResponse<Customer>> {
  try {
    const response = await tsaraApi.get(`/customers/${customerId}`);
    return response.data;
  } catch (error: any) {
    console.error("Get customer failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to get customer");
  }
}

export async function updateCustomer(customerId: string, data: {
  email?: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}): Promise<TsaraResponse<Customer>> {
  try {
    const response = await tsaraApi.put(`/customers/${customerId}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Update customer failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to update customer");
  }
}

/**
 * Get or create a Tsara customer for a buyer
 * This ensures the buyer has a valid Tsara customer ID stored in the database
 */
export async function getOrCreateTsaraCustomer(
  buyerId: string,
  buyerInfo: {
    email: string;
    name?: string;
    phone?: string;
  }
): Promise<string> {
  try {
    // First check if buyer already has a Tsara customer ID
    const [buyer] = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId));

    if (buyer?.tsaraCustomerId) {
      // Verify the customer still exists in Tsara
      try {
        await getCustomer(buyer.tsaraCustomerId);
        console.log('[Tsara Customer] Using existing customer ID:', buyer.tsaraCustomerId);
        return buyer.tsaraCustomerId;
      } catch (err) {
        console.warn('[Tsara Customer] Existing customer not found in Tsara, creating new one');
        // Continue to create new customer
      }
    }

    // Create new customer in Tsara
    const response = await createCustomer({
      email: buyerInfo.email,
      name: buyerInfo.name,
      phone: buyerInfo.phone,
      metadata: {
        buyer_id: buyerId,
        platform: 'luxela',
      },
    });

    const customerId = response.data?.id || (response.data as any)?.id;
    
    if (!customerId) {
      throw new Error('Tsara did not return a customer ID');
    }

    // Store the Tsara customer ID in our database
    await db
      .update(buyers)
      .set({
        tsaraCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, buyerId));

    console.log('[Tsara Customer] Stored new customer ID in database:', customerId);
    return customerId;
  } catch (error: any) {
    console.error('[Tsara Customer] Get or create error:', {
      buyerId,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Ensure buyer has a Tsara customer ID before payment
 * Call this during checkout initialization
 */
export async function ensureTsaraCustomerId(
  buyerId: string,
  customerEmail: string,
  customerName?: string,
  customerPhone?: string
): Promise<string> {
  return getOrCreateTsaraCustomer(buyerId, {
    email: customerEmail,
    name: customerName,
    phone: customerPhone,
  });
}