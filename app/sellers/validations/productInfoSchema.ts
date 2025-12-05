import * as Yup from "yup";

export const productInfoValidationSchema = Yup.object({
  price: Yup.string()
    .required("Price is required")
    .matches(/^[0-9,.₦\s]+$/, "Please enter a valid price"),
  name: Yup.string()
    .required("Product name is required")
    .min(3, "Product name must be at least 3 characters")
    .max(100, "Product name must be less than 100 characters"),
  type: Yup.string().required("Product type is required"),
  description: Yup.string()
    .required("Product description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  supplyCount: Yup.number()
    .typeError("Supply count must be a number")
    .positive("Supply count must be positive")
    .integer("Supply count must be a whole number"),
});
