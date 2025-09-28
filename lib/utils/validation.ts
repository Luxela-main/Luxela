import * as z from 'zod';
import * as yup from "yup";

export const signinSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' }),
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

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
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
  