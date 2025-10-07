import * as Yup from "yup";

export const BillingAddressValidationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name cannot exceed 50 characters")
    .required("Full name is required"),

  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email is required"),

  phone: Yup.string()
    .matches(/^\+?\d{7,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),

  state: Yup.string().required("State is required"),

  city: Yup.string().required("City is required"),

  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .required("Address is required"),

  postalCode: Yup.string()
    .matches(/^\d{4,10}$/, "Please enter a valid postal code")
    .required("Postal code is required"),

  saveDetails: Yup.boolean(),
});
