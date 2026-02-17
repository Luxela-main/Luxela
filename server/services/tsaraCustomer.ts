import { tsaraApi, TsaraResponse } from './tsara';

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
  created_at: string;
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