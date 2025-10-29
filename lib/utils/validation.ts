import * as yup from "yup";

export const signinSchema = yup.object().shape({
  email: yup.string().email("Please enter a valid email address").required(),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required(),
});

export const signupSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase, one lowercase, and one number"
    )
    .required("Password is required"),
  role: yup
    .string()
    .oneOf(["buyer", "seller"], "Please select a valid role")
    .required("Role is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required("Confirm your password"),
  agreeTerms: yup
    .boolean()
    .oneOf([true], "You must agree to the terms and conditions"),
});

export const verifyOtpSchema = yup.object().shape({
  otp: yup.string().length(6, "OTP must be 6 digits").required(),
});

export const resetPasswordSchema = yup.object().shape({
  email: yup.string().email("Please enter a valid email address").required(),
});

export const newPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase, one lowercase, and one number"
    )
    .required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required(),
});

export const signInInitialValues = {
  email: "",
  password: "",
  agreeTerms: false,
};

export const signUpInitialValues = {
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  agreeTerms: false,
};

export const BillingAddressValidationSchema = yup.object().shape({
  fullName: yup
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name cannot exceed 50 characters")
    .required("Full name is required"),

  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),

  phone: yup
    .string()
    .matches(/^\+?\d{7,15}$/, "Please enter a valid phone number")
    .required("Phone number is required"),

  state: yup.string().required("State is required"),

  city: yup.string().required("City is required"),

  address: yup
    .string()
    .min(10, "Address must be at least 10 characters")
    .required("Address is required"),

  postalCode: yup
    .string()
    .matches(/^\d{4,10}$/, "Please enter a valid postal code")
    .required("Postal code is required"),

  saveDetails: yup.boolean(),
});
