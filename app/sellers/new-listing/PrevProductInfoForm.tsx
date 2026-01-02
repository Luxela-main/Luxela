import React from "react";
import { useFormik } from "formik";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductData } from "@/types";
import ImageUpload from "./image-upload";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { productInfoValidationSchema } from "../validations/productInfoSchema";

interface ProductInfoFormProps {
  product: ProductData;
  onProductChange: (product: ProductData) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  setActiveTab: (
    tab: "Product Information" | "Additional Information" | "Preview"
  ) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const ProductInfoForm: React.FC<ProductInfoFormProps> = ({
  product,
  onProductChange,
  images,
  onImagesChange,
  setActiveTab,
  onValidationChange,
}) => {
  const formik = useFormik({
    initialValues: product,
    validationSchema: productInfoValidationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onProductChange(values);
      setActiveTab("Additional Information");
    },
  });

  // Notify parent of validation state changes
  React.useEffect(() => {
    const isValid = formik.isValid && formik.dirty;
    onValidationChange?.(isValid);
  }, [formik.isValid, formik.dirty, onValidationChange]);

  const handleFieldChange = (field: keyof ProductData, value: string) => {
    formik.setFieldValue(field, value);
    onProductChange({ ...formik.values, [field]: value });
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
    <form onSubmit={formik.handleSubmit}>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5 space-y-6">
          <ImageUpload images={images} onImagesChange={onImagesChange} />

          <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">
              Availability & Release
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 font-medium">
                  Release date
                </label>
                <Input
                  value={formik.values.releaseDate}
                  onChange={(e) =>
                    handleFieldChange("releaseDate", e.target.value)
                  }
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Supply count
                </label>
                <Input
                  name="supplyCount"
                  value={formik.values.supplyCount}
                  onChange={(e) =>
                    handleFieldChange("supplyCount", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                    formik.errors.supplyCount && formik.touched.supplyCount
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="40"
                  type="number"
                />
                <ErrorMessage name="supplyCount" />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Supply text
                </label>
                <Input
                  value={formik.values.supplyText}
                  onChange={(e) =>
                    handleFieldChange("supplyText", e.target.value)
                  }
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  placeholder="Limited supply"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Limited edition badge
                </label>
                <Input
                  value={formik.values.badge}
                  onChange={(e) => handleFieldChange("badge", e.target.value)}
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  placeholder="Show badge"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Duration text
                </label>
                <Input
                  value={formik.values.durationText}
                  onChange={(e) =>
                    handleFieldChange("durationText", e.target.value)
                  }
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  placeholder="Limited time"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium">
                  Duration time
                </label>
                <Input
                  value={formik.values.durationTime}
                  onChange={(e) =>
                    handleFieldChange("durationTime", e.target.value)
                  }
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                  placeholder="30 Days, 20 Hours"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="col-span-7">
          <div className="space-y-6">
            <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Product name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formik.values.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={formik.handleBlur}
                    className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                      formik.errors.name && formik.touched.name
                        ? "border-red-500"
                        : ""
                    }`}
                    placeholder="Name of Product"
                  />
                  <ErrorMessage name="name" />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="price"
                    value={formik.values.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    onBlur={formik.handleBlur}
                    className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                      formik.errors.price && formik.touched.price
                        ? "border-red-500"
                        : ""
                    }`}
                    placeholder="₦4,500.00"
                  />
                  <ErrorMessage name="price" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm mb-2 font-medium">
                  Product type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formik.values.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 rounded-md px-3 py-2 text-white ${
                    formik.errors.type && formik.touched.type
                      ? "border-red-500"
                      : ""
                  }`}
                >
                  <option value="">Select a category</option>
                  <option value="men_clothing">Men's Clothing</option>
                  <option value="women_clothing">Women's Clothing</option>
                  <option value="men_shoes">Men's Shoes</option>
                  <option value="women_shoes">Women's Shoes</option>
                  <option value="accessories">Accessories</option>
                  <option value="merch">Merchandise</option>
                  <option value="others">Others</option>
                </select>
                <ErrorMessage name="type" />
              </div>

              <div className="mt-4">
                <label className="block text-sm mb-2 font-medium">
                  Product description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="description"
                  value={formik.values.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  onBlur={formik.handleBlur}
                  className={`bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[120px] ${
                    formik.errors.description && formik.touched.description
                      ? "border-red-500"
                      : ""
                  }`}
                  placeholder="Product description..."
                />
                <ErrorMessage name="description" />
              </div>
            </div>

            <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Product Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Sizes available
                  </label>
                  <Input
                    value={formik.values.sizes}
                    onChange={(e) => handleFieldChange("sizes", e.target.value)}
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="S, M, L, XL"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Colour options
                  </label>
                  <Input
                    value={formik.values.colors}
                    onChange={(e) =>
                      handleFieldChange("colors", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="Yellow, Black, Magenta"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Material/Composition
                  </label>
                  <Input
                    value={formik.values.material}
                    onChange={(e) =>
                      handleFieldChange("material", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="Cotton, Polyester"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Target audience
                  </label>
                  <Input
                    value={formik.values.audience}
                    onChange={(e) =>
                      handleFieldChange("audience", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="Unisex"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] p-6 rounded-lg border border-[#333]">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">
                Shipping Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Shipping options
                  </label>
                  <Input
                    value={formik.values.shipping}
                    onChange={(e) =>
                      handleFieldChange("shipping", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="Domestic and international shipping"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-medium">
                    Estimated shipping time
                  </label>
                  <Input
                    value={formik.values.shippingEstimate}
                    onChange={(e) =>
                      handleFieldChange("shippingEstimate", e.target.value)
                    }
                    className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    placeholder="2 Days within country, 10 Days international"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 px-8">
              Next
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProductInfoForm;
