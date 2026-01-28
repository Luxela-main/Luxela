"use client";

import { Store, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { uploadImage, deleteImage, validateImageFile } from "@/lib/upload-image";
import { useState, useRef } from "react";

interface StoreAccountProps {
  initialData: any;
}

const validationSchema = Yup.object({
  brandName: Yup.string().required("Store name is required"),
  storeDescription: Yup.string().required("Store description is required"),
});

export function StoreAccount({ initialData }: StoreAccountProps) {
  const utils = trpc.useUtils();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const updateStoreMutation = (trpc.seller as any).updateSellerBusiness.useMutation({
    onSuccess: () => {
      toastSvc.success("Store details updated successfully");
      (utils.seller as any).getProfile.invalidate();
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to update store details");
    },
  });

  const formik = useFormik({
    initialValues: {
      brandName: initialData?.business?.brandName || "",
      storeDescription: initialData?.business?.storeDescription || "",
      storeLogo: initialData?.business?.storeLogo || "",
      storeBanner: initialData?.business?.storeBanner || "",
      logoPath: "", // Track file paths for deletion
      bannerPath: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateStoreMutation.mutateAsync({
        brandName: values.brandName,
        storeDescription: values.storeDescription,
        storeLogo: values.storeLogo,
        storeBanner: values.storeBanner,
        fullName: initialData?.business?.fullName || "Seller Name",
        businessType: initialData?.business?.businessType || "individual",
        businessAddress: initialData?.business?.businessAddress || "Not provided",
        officialEmail: initialData?.business?.officialEmail || "email@example.com",
        phoneNumber: initialData?.business?.phoneNumber || "0000000000",
        country: initialData?.business?.country || "Nigeria",
        idType: initialData?.business?.idType || "national_id",
      });
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
      return;
    }

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (formik.values.logoPath) {
        await deleteImage(formik.values.logoPath);
      }

      const result = await uploadImage(file, 'store-assets', 'logos', false);
      
      if (result) {
        formik.setFieldValue('storeLogo', result.url);
        formik.setFieldValue('logoPath', result.path);
        toastSvc.success("Logo uploaded successfully");
      }
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      // Reset input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      // Reset input
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
      return;
    }

    setUploadingBanner(true);
    try {
      // Delete old banner if exists
      if (formik.values.bannerPath) {
        await deleteImage(formik.values.bannerPath);
      }

      const result = await uploadImage(file, 'store-assets', 'banners');
      
      if (result) {
        formik.setFieldValue('storeBanner', result.url);
        formik.setFieldValue('bannerPath', result.path);
        toastSvc.success("Banner uploaded successfully");
      }
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
      // Reset input
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const removeLogo = async () => {
    if (formik.values.logoPath) {
      await deleteImage(formik.values.logoPath);
    }
    formik.setFieldValue('storeLogo', '');
    formik.setFieldValue('logoPath', '');
  };

  const removeBanner = async () => {
    if (formik.values.bannerPath) {
      await deleteImage(formik.values.bannerPath);
    }
    formik.setFieldValue('storeBanner', '');
    formik.setFieldValue('bannerPath', '');
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Store Account</h2>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-2">Store Name</label>
          <Input
            name="brandName"
            value={formik.values.brandName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.brandName && formik.errors.brandName ? "border-red-500" : ""
            }`}
          />
          {formik.touched.brandName && formik.errors.brandName && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.brandName as string}</div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Store Description</label>
          <Textarea
            name="storeDescription"
            value={formik.values.storeDescription}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px] ${
              formik.touched.storeDescription && formik.errors.storeDescription ? "border-red-500" : ""
            }`}
          />
          {formik.touched.storeDescription && formik.errors.storeDescription && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.storeDescription as string}</div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Store Logo</label>
          <div className="flex items-center mb-2">
            <div className="w-16 h-16 bg-[#222] rounded-md mr-4 flex items-center justify-center overflow-hidden relative">
              {formik.values.storeLogo ? (
                <>
                  <img src={formik.values.storeLogo} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 hover:bg-red-600 cursor-pointer transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <Store className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white cursor-pointer disabled:cursor-not-allowed transition"
            >
              {uploadingLogo ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Accepted formats: JPEG, PNG, WebP • Recommended: 400x400px • Max 5MB
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">Store Banner</label>
          <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#222] h-40 relative overflow-hidden">
            {formik.values.storeBanner ? (
              <>
                <img 
                  src={formik.values.storeBanner} 
                  alt="Banner" 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2 hover:bg-red-600 z-10 cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : null}
            <div className="z-10 flex flex-col items-center">
              <input
                ref={bannerInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="bg-transparent border-[#333] hover:bg-[#333] hover:text-white cursor-pointer disabled:cursor-not-allowed transition"
              >
                {uploadingBanner ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Accepted formats: JPEG, PNG, WebP • Recommended: 1200x300px • Max 5MB
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:cursor-not-allowed transition"
            disabled={updateStoreMutation.isPending || !formik.isValid}
          >
            {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}