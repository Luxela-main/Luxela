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
    const response = await tsaraApi.post("/customers", data);
    return response.data;
  } catch (error: any) {
    console.error("Create customer failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create customer");
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