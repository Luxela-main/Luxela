import React, { useState } from "react";
import { ListingForm } from "@/types";
import { Button } from "@/components/ui/button";
import { SuccessPage } from "./SuccessPage";
import { toastSvc } from "@/services/toast";

interface PreviewProps {
  formData: ListingForm;
  handleSubmit: () => void;
  handleReset: () => void;
}

const Preview: React.FC<PreviewProps> = ({
  formData,
  handleReset,
  handleSubmit,
}) => {
  const { product, images } = formData;
  const [showSuccess, setShowSuccess] = useState(false);

  const submitHandler = () => {
    if (!images.length) {
      toastSvc.error("Please upload at least one image!");
      return;
    }

    handleSubmit();
    setShowSuccess(true);
  };

  const resetHandler = () => {
    setShowSuccess(false);
    handleReset();
  };

  return (
    <div className="relative">
      <div
        className={`relative grid grid-cols-12 gap-8 transition-all duration-300 ${
          showSuccess ? "blur-sm" : ""
        }`}>
        <div className="col-span-5">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Product Images</h3>
            {images.length > 0 ? (
              <div className="space-y-4">
                <div className="aspect-video w-full">
                  <img
                    src={URL.createObjectURL(images[0])}
                    alt="Main product"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={URL.createObjectURL(image)}
                        alt={`Product ${index + 2}`}
                        className="aspect-square w-full object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No images uploaded</p>
            )}
          </div>
        </div>

        <div className="col-span-7">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>{" "}
                {product.name || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Price:</span>{" "}
                {product.price || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Type:</span>{" "}
                {product.type || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Description:</span>{" "}
                {product.description || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Sizes:</span>{" "}
                {product.sizes || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Material:</span>{" "}
                {product.material ||
                  product.materialComposition ||
                  "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Colors:</span>{" "}
                {product.colors || product.colorsAvailable || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Target Audience:</span>{" "}
                {product.targetAudience || product.audience || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Shipping:</span>{" "}
                {product.shippingOption || product.shipping || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Supply Count:</span>{" "}
                {product.supplyCount || "Not specified"}
              </div>
              <div>
                <span className="text-gray-400">Release Date:</span>{" "}
                {product.releaseDate || "Not specified"}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 space-x-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="bg-transparent border-[#333] hover:bg-[#222] hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={submitHandler}
              className="bg-purple-600 hover:bg-purple-700">
              Submit Listing
            </Button>
          </div>
        </div>
      </div>

      {showSuccess && <SuccessPage onReset={resetHandler} />}
    </div>
  );
};

export default Preview;
