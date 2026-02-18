export const getErrorMessage = (error: any): string => {
  // Handle null/undefined
  if (!error) {
    return "An unexpected error occurred";
  }
  
  // Handle tRPC errors (message is directly on error object)
  if (error?.message && typeof error.message === 'string' && error.message.trim() !== '') {
    return error.message;
  }
  
  // Handle API response structure
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Handle data.message (alternative structure)
  if (error?.data?.message) {
    return error.data.message;
  }
  
  // Handle tRPC shape (for serialized errors)
  if (error?.shape?.message) {
    return error.shape.message;
  }
  
  // Handle error string representation
  const errStr = error.toString?.();
  if (errStr && errStr !== '[object Object]' && errStr.trim() !== '') {
    return errStr;
  }
  
  return "An unexpected error occurred";
};

export const getAxiosErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.code === "NETWORK_ERROR") {
    return "Network error: Please check your internet connection";
  }
  if (error?.response?.status === 404) {
    return "Resource not found";
  }
  if (error?.response?.status === 500) {
    return "Internal server error";
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
};