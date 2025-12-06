"use client";

import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

interface StoreSettingsProps {
  initialData: any;
}

const validationSchema = Yup.object({
  brandName: Yup.string().required("Store name is required"),
  storeDescription: Yup.string().required("Store description is required"),
});

export function StoreSettings({ initialData }: StoreSettingsProps) {
  const utils = trpc.useUtils();
  
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
      // Placeholder for now as file upload requires more complex logic
      storeLogo: initialData?.business?.storeLogo || "",
      storeBanner: initialData?.business?.storeBanner || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateStoreMutation.mutateAsync({
        brandName: values.brandName,
        storeDescription: values.storeDescription,
        storeLogo: values.storeLogo,
        storeBanner: values.storeBanner,
        // Preserve other required fields
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

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Store Settings</h2>

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
            <div className="w-16 h-16 bg-[#222] rounded-md mr-4 flex items-center justify-center overflow-hidden">
             {formik.values.storeLogo ? (
                <img src={formik.values.storeLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white">
              Upload Logo
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Recommended: 400x400px, Max 5MB
          </p>
        </div>

        <div>
          <label className="block text-sm mb-2">Store Banner</label>
          <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#222] h-40 relative overflow-hidden">
             {formik.values.storeBanner ? (
                <img src={formik.values.storeBanner} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              ) : null}
            <div className="z-10 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-2">
                Drag and drop banner image here or click to browse
                </p>
                <Button
                type="button"
                variant="outline"
                className="bg-transparent border-[#333] hover:bg-[#333] hover:text-white">
                Upload Banner
                </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Recommended: 1200x300px, Max 10MB
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={updateStoreMutation.isPending || !formik.isValid}
          >
            {updateStoreMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
