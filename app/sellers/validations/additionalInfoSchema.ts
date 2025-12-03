import * as Yup from "yup";

export const additionalInformationsValidationSchema = Yup.object({
  materialComposition: Yup.string().min(
    2,
    "Material must be at least 2 characters"
  ),
  colorsAvailable: Yup.string().min(2, "Please enter at least one color"),
  targetAudience: Yup.string().oneOf(
    ["male", "female", "unisex"],
    "Please select a target audience"
  ),
  shippingOption: Yup.string().oneOf(
    ["local", "international", "both"],
    "Please select a shipping option"
  ),
  domesticDays: Yup.number()
    .typeError("Must be a number")
    .positive("Days must be positive")
    .integer("Days must be a whole number")
    .max(365, "Days cannot exceed 365"),
  domesticMinutes: Yup.number()
    .typeError("Must be a number")
    .min(0, "Minutes cannot be negative")
    .max(1440, "Minutes cannot exceed 1440 (24 hours)"),
  internationalDays: Yup.number()
    .typeError("Must be a number")
    .positive("Days must be positive")
    .integer("Days must be a whole number")
    .max(365, "Days cannot exceed 365"),
  internationalMinutes: Yup.number()
    .typeError("Must be a number")
    .min(0, "Minutes cannot be negative")
    .max(1440, "Minutes cannot exceed 1440 (24 hours)"),
});
