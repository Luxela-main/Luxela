import React from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProductData } from "@/types";
import ImageUpload from "./image-upload";
import { AlertCircle } from "lucide-react";
import { additionalInformationsValidationSchema } from "../validations/additionalInfoSchema";

interface AdditionalInfoFormProps {
  product: ProductData;
  onProductChange: (product: ProductData) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  setActiveTab: (
    tab: "Product Information" | "Additional Information" | "Preview"
  ) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const AdditionalInfoForm: React.FC<AdditionalInfoFormProps> = ({
  product,
  onProductChange,
  images,
  onImagesChange,
  setActiveTab,
  onValidationChange,
}) => {
  const formik = useFormik({
    initialValues: {
      materialComposition: product.materialComposition || "",
      colorsAvailable: product.colorsAvailable || "",
      targetAudience: product.targetAudience || "unisex",
      shippingOption: product.shippingOption || "local",
      domesticDays: product.domesticDays || "",
      domesticMinutes: product.domesticMinutes || "",
      internationalDays: product.internationalDays || "",
      internationalMinutes: product.internationalMinutes || "",
    },
    validationSchema: additionalInformationsValidationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onProductChange({ ...product, ...values });
      setActiveTab("Preview");
    },
  });

  // Notify parent of validation state changes
  React.useEffect(() => {
    const isValid = formik.isValid && formik.dirty;
    onValidationChange?.(isValid);
  }, [formik.isValid, formik.dirty, onValidationChange]);

  const handleFieldChange = (field: keyof ProductData, value: string) => {
    formik.setFieldValue(field, value);
    onProductChange({ ...product, [field]: value });
  };

  const handleAudienceSelect = (audience: "male" | "female" | "unisex") => {
    formik.setFieldValue("targetAudience", audience);
    onProductChange({ ...product, targetAudience: audience });
  };

  const handleSubmit = () => {
    formik.handleSubmit();
  };

  const ErrorMessage = ({ name }: { name: string }) => {
    const error = formik.errors[name as keyof typeof formik.errors];
    const touched = formik.touched[name as keyof typeof formik.touched];

    return error && touched ? (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="w-3 h-3" />
        <span>{error}</span>
      </div>
    ) : null;
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      <ImageUpload images={images} onImagesChange={onImagesChange} />

      <div className="col-span-7">
        <div className="space-y-6">
          <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              Product Specifications
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-medium">
                  Material/Composition
                </label>
                <Input
                  name="materialComposition"
                  value={formik.values.materialComposition}
                  onChange={(e) =>
                    handleFieldChange("materialComposition", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  placeholder="What material is your product made from"
                  className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                    formik.errors.materialComposition &&
                    formik.touched.materialComposition
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <ErrorMessage name="materialComposition" />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Colors available
                </label>
                <Input
                  name="colorsAvailable"
                  value={formik.values.colorsAvailable}
                  onChange={(e) =>
                    handleFieldChange("colorsAvailable", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  placeholder="Enter all product colours"
                  className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                    formik.errors.colorsAvailable &&
                    formik.touched.colorsAvailable
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <ErrorMessage name="colorsAvailable" />
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              Target Audience
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {(["male", "female", "unisex"] as const).map((audience) => (
                <Button
                  key={audience}
                  type="button"
                  variant="outline"
                  onClick={() => handleAudienceSelect(audience)}
                  className={`${
                    formik.values.targetAudience === audience
                      ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
                      : "bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:text-white"
                  } transition-all`}>
                  {audience.charAt(0).toUpperCase() + audience.slice(1)}
                </Button>
              ))}
            </div>
            <ErrorMessage name="targetAudience" />
          </div>

          <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              Shipping Information
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-3 font-medium">
                  Shipping option
                </label>
                <RadioGroup
                  value={formik.values.shippingOption}
                  onValueChange={(value) => {
                    formik.setFieldValue("shippingOption", value);
                    handleFieldChange("shippingOption", value);
                  }}
                  className="grid grid-cols-3 gap-4">
                  {(["local", "international", "both"] as const).map(
                    (option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2 bg-[#1a1a1a] border border-[#333] rounded-md p-3 hover:border-purple-600 transition-colors cursor-pointer">
                        <RadioGroupItem
                          value={option}
                          id={option}
                          className="text-purple-600"
                        />
                        <Label
                          htmlFor={option}
                          className="capitalize cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
                <ErrorMessage name="shippingOption" />
              </div>

              <div>
                <label className="block text-sm mb-3 font-medium">
                  Estimated shipping time
                </label>

                <div className="mb-6 bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-sm text-purple-400 mb-3 font-medium">
                    Within country
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="domesticDays"
                        value={formik.values.domesticDays}
                        onChange={(e) =>
                          handleFieldChange("domesticDays", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="00 Days"
                        type="number"
                        className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                          formik.errors.domesticDays &&
                          formik.touched.domesticDays
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      <ErrorMessage name="domesticDays" />
                    </div>
                    <div>
                      <Input
                        name="domesticMinutes"
                        value={formik.values.domesticMinutes}
                        onChange={(e) =>
                          handleFieldChange("domesticMinutes", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="00 Minutes"
                        type="number"
                        className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                          formik.errors.domesticMinutes &&
                          formik.touched.domesticMinutes
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      <ErrorMessage name="domesticMinutes" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <p className="text-sm text-purple-400 mb-3 font-medium">
                    International
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="internationalDays"
                        value={formik.values.internationalDays}
                        onChange={(e) =>
                          handleFieldChange("internationalDays", e.target.value)
                        }
                        onBlur={formik.handleBlur}
                        placeholder="00 Days"
                        type="number"
                        className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                          formik.errors.internationalDays &&
                          formik.touched.internationalDays
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      <ErrorMessage name="internationalDays" />
                    </div>
                    <div>
                      <Input
                        name="internationalMinutes"
                        value={formik.values.internationalMinutes}
                        onChange={(e) =>
                          handleFieldChange(
                            "internationalMinutes",
                            e.target.value
                          )
                        }
                        onBlur={formik.handleBlur}
                        placeholder="00 Minutes"
                        type="number"
                        className={`bg-[#0f0f0f] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                          formik.errors.internationalMinutes &&
                          formik.touched.internationalMinutes
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      <ErrorMessage name="internationalMinutes" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            onClick={() => setActiveTab("Product Information")}
            variant="outline"
            className="bg-transparent border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
            Previous
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 px-8">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoForm;
