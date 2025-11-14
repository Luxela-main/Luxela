export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
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
