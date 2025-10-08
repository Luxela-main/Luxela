import * as z from 'zod';
import * as yup from "yup";

export const signinSchema = yup.object().shape({
  email: yup.string().email("Please enter a valid email address").required(),
  password: yup.string().min(8, "Password must be at least 8 characters").required(),
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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase, one lowercase, and one number")
    .required(),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords don't match").required(),
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
  