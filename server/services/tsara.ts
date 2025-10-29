import axios from "axios";

const TSARA_BASE_URL =process.env.TSARA_BASE_URL!;
const TSARA_SECRET_KEY = process.env.TSARA_SECRET_KEY!;

export const tsaraApi = axios.create({
  baseURL: TSARA_BASE_URL,
  headers: {
    Authorization: `Bearer ${TSARA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});



// ---- CREATE PAYMENT LINK ----
export async function createPaymentLink(data: any) {
  try {
    const res = await tsaraApi.post("/payment-links", data);
    return res.data;
  } catch (error: any) {
    console.error("Create payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create payment link");
  }
}

// ---- RETRIEVE PAYMENT LINK ----
export async function retrievePaymentLink(plinkId: string) {
  try {
    const response = await tsaraApi.get(`/payment-links/${plinkId}`);
    return response.data;
  } catch (error: any) {
    console.error("Retrieve payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to retrieve payment link");
  }
}

// ---- GET PAYMENT LINK (alias for retrieve) ----
export async function getPaymentLink(id: string) {
  try {
    const res = await tsaraApi.get(`/payment-links/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Get payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to get payment link");
  }
}

// ---- LIST PAYMENT LINKS ----
export async function listPaymentLinks(page = 1, limit = 20) {
  try {
    const res = await tsaraApi.get(`/payment-links?page=${page}&limit=${limit}`);
    return res.data;
  } catch (error: any) {
    console.error("List payment links failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to list payment links");
  }
}

// ---- DISABLE PAYMENT LINK ----
export async function disablePaymentLink(id: string) {
  try {
    const res = await tsaraApi.post(`/payment-links/${id}/disable`);
    return res.data;
  } catch (error: any) {
    console.error("Disable payment link failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to disable payment link");
  }
}

