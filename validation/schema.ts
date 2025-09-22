import * as yup from "yup";

export const signUpSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    //   "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    // )
    .required("Password is required"),
});

export const signInSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
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
  agreeTerms: false,
};
