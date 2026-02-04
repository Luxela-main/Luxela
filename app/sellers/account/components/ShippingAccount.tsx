"use client";

import { useState } from "react";
import { Truck, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

interface ShippingAccountProps {
  initialData: any;
}

const validationSchema = Yup.object({
  shippingZone: Yup.string().required("Shipping zone is required"),
  city: Yup.string().required("City is required"),
  shippingAddress: Yup.string().required("Shipping address is required"),
  returnAddress: Yup.string().required("Return address is required"),
  shippingType: Yup.string().required("Shipping type is required"),
  estimatedShippingTime: Yup.string().required("Estimated shipping time is required"),
  refundPolicy: Yup.string().required("Refund policy is required"),
  refundPeriod: Yup.string().required("Refund period is required"),
});

const shippingTypeOptions = [
  { value: "domestic", label: "Domestic Only" },
  { value: "international", label: "International Only" },
  { value: "both", label: "Both Domestic & International" },
];

const estimatedShippingTimeOptions = [
  { value: "same_day", label: "Same Day" },
  { value: "next_day", label: "Next Day" },
  { value: "48hrs", label: "48 Hours" },
  { value: "72hrs", label: "72 Hours" },
  { value: "5_working_days", label: "5 Working Days" },
  { value: "1_2_weeks", label: "1-2 Weeks" },
  { value: "2_3_weeks", label: "2-3 Weeks" },
  { value: "1week", label: "1 Week" },
  { value: "custom", label: "Custom" },
];

const refundPolicyOptions = [
  { value: "no_refunds", label: "No Refunds" },
  { value: "48hrs", label: "48 Hours" },
  { value: "72hrs", label: "72 Hours" },
  { value: "5_working_days", label: "5 Working Days" },
  { value: "1week", label: "1 Week" },
  { value: "14days", label: "14 Days" },
  { value: "30days", label: "30 Days" },
  { value: "60days", label: "60 Days" },
  { value: "store_credit", label: "Store Credit Only" },
];

const refundPeriodOptions = [
  { value: "same_day", label: "Same Day" },
  { value: "next_day", label: "Next Day" },
  { value: "48hrs", label: "48 Hours" },
  { value: "72hrs", label: "72 Hours" },
  { value: "5_working_days", label: "5 Working Days" },
  { value: "1_2_weeks", label: "1-2 Weeks" },
  { value: "2_3_weeks", label: "2-3 Weeks" },
  { value: "1week", label: "1 Week" },
  { value: "14days", label: "14 Days" },
  { value: "30days", label: "30 Days" },
  { value: "60days", label: "60 Days" },
  { value: "store_credit", label: "Store Credit" },
  { value: "custom", label: "Custom" },
];

export function ShippingAccount({ initialData }: ShippingAccountProps) {
  const utils = trpc.useUtils();
  const [isEditMode, setIsEditMode] = useState(false);

  const updateShippingMutation = trpc.seller.updateSellerShipping.useMutation({
    onSuccess: () => {
      toastSvc.success("Shipping details updated successfully");
      (utils.seller as any).getProfile.invalidate();
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to update shipping details");
    },
  });

  const formik = useFormik({
    initialValues: {
      shippingZone: initialData?.shipping?.shippingZone || "",
      city: initialData?.shipping?.city || "",
      shippingAddress: initialData?.shipping?.shippingAddress || "",
      returnAddress: initialData?.shipping?.returnAddress || "",
      shippingType: initialData?.shipping?.shippingType || "domestic",
      estimatedShippingTime: initialData?.shipping?.estimatedShippingTime || "1_2_weeks",
      refundPolicy: initialData?.shipping?.refundPolicy || "30days",
      refundPeriod: initialData?.shipping?.refundPeriod || "14days",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateShippingMutation.mutateAsync(values);
    },
  });

  const handleCancel = () => {
    formik.resetForm();
    setIsEditMode(false);
  };

  const getLabel = (value: string, options: Array<{ value: string; label: string }>) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Shipping & Returns</h2>
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm cursor-pointer transition"
          >
            Edit Account
          </button>
        )}
      </div>

      {!isEditMode ? (
        <div className="space-y-6">
          {/* Shipping Information */}
          <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
            <div className="flex items-start mb-4">
              <MapPin className="h-5 w-5 text-purple-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-400 text-sm">Shipping Zone</p>
                <p className="text-white font-medium">{formik.values.shippingZone || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
              <p className="text-gray-400 text-sm mb-2">City</p>
              <p className="text-white font-medium">{formik.values.city || "—"}</p>
            </div>
            <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
              <p className="text-gray-400 text-sm mb-2">Shipping Type</p>
              <p className="text-white font-medium">
                {getLabel(formik.values.shippingType, shippingTypeOptions)}
              </p>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">Shipping Address</p>
            <p className="text-white whitespace-pre-wrap">{formik.values.shippingAddress || "—"}</p>
          </div>

          <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
            <p className="text-gray-400 text-sm mb-2">Return Address</p>
            <p className="text-white whitespace-pre-wrap">{formik.values.returnAddress || "—"}</p>
          </div>

          {/* Delivery & Refund Information */}
          <div className="border-t border-[#333] pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-400" />
              Delivery & Refund Policy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                <p className="text-gray-400 text-sm mb-2">Estimated Shipping Time</p>
                <p className="text-white font-medium">
                  {getLabel(formik.values.estimatedShippingTime, estimatedShippingTimeOptions)}
                </p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
                <p className="text-gray-400 text-sm mb-2">Refund Policy</p>
                <p className="text-white font-medium">
                  {getLabel(formik.values.refundPolicy, refundPolicyOptions)}
                </p>
              </div>
            </div>

            <div className="mt-4 bg-[#0f0f0f] rounded-lg p-4 border border-[#333]">
              <p className="text-gray-400 text-sm mb-2">Refund Processing Period</p>
              <p className="text-white font-medium">
                {getLabel(formik.values.refundPeriod, refundPeriodOptions)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Shipping Information Section */}
          <div className="border-b border-[#333] pb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-purple-400" />
              Shipping Information
            </h3>

            <div>
              <label className="block text-sm mb-2">Shipping Zone</label>
              <Input
                name="shippingZone"
                value={formik.values.shippingZone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={!isEditMode}
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="e.g., West Africa"
              />
              {formik.touched.shippingZone && formik.errors.shippingZone && (
                <div className="text-red-500 text-xs mt-1">{typeof formik.errors.shippingZone === 'string' ? formik.errors.shippingZone : ''}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm mb-2">City</label>
                <Input
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!isEditMode}
                  className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="e.g., Lagos"
                />
                {formik.touched.city && formik.errors.city && (
                  <div className="text-red-500 text-xs mt-1">{typeof formik.errors.city === 'string' ? formik.errors.city : ''}</div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">Shipping Type</label>
                <select
                  name="shippingType"
                  value={formik.values.shippingType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!isEditMode}
                  className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {shippingTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formik.touched.shippingType && formik.errors.shippingType && (
                  <div className="text-red-500 text-xs mt-1">{typeof formik.errors.shippingType === 'string' ? formik.errors.shippingType : ''}</div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-2">Shipping Address</label>
              <Textarea
                name="shippingAddress"
                value={formik.values.shippingAddress}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={!isEditMode}
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter your shipping address"
              />
              {formik.touched.shippingAddress && formik.errors.shippingAddress && (
                <div className="text-red-500 text-xs mt-1">{typeof formik.errors.shippingAddress === 'string' ? formik.errors.shippingAddress : ''}</div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-2">Return Address</label>
              <Textarea
                name="returnAddress"
                value={formik.values.returnAddress}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={!isEditMode}
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px] disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Enter your return address"
              />
              {formik.touched.returnAddress && formik.errors.returnAddress && (
                <div className="text-red-500 text-xs mt-1">{typeof formik.errors.returnAddress === 'string' ? formik.errors.returnAddress : ''}</div>
              )}
            </div>
          </div>

          {/* Delivery & Refund Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-purple-400" />
              Delivery & Refund Policy
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Estimated Shipping Time</label>
                <select
                  name="estimatedShippingTime"
                  value={formik.values.estimatedShippingTime}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!isEditMode}
                  className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {estimatedShippingTimeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formik.touched.estimatedShippingTime && formik.errors.estimatedShippingTime && (
                  <div className="text-red-500 text-xs mt-1">{typeof formik.errors.estimatedShippingTime === 'string' ? formik.errors.estimatedShippingTime : ''}</div>
                )}
              </div>

              <div>
                <label className="block text-sm mb-2">Refund Policy</label>
                <select
                  name="refundPolicy"
                  value={formik.values.refundPolicy}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={!isEditMode}
                  className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {refundPolicyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formik.touched.refundPolicy && formik.errors.refundPolicy && (
                  <div className="text-red-500 text-xs mt-1">{typeof formik.errors.refundPolicy === 'string' ? formik.errors.refundPolicy : ''}</div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-2">Refund Processing Period</label>
              <select
                name="refundPeriod"
                value={formik.values.refundPeriod}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={!isEditMode}
                className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 focus:border-purple-600 focus:ring-purple-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {refundPeriodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formik.touched.refundPeriod && formik.errors.refundPeriod && (
                <div className="text-red-500 text-xs mt-1">{typeof formik.errors.refundPeriod === 'string' ? formik.errors.refundPeriod : ''}</div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#333]">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-[#222] border-[#333] hover:bg-[#333] cursor-pointer transition"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:cursor-not-allowed transition"
              disabled={updateShippingMutation.isPending || !formik.isValid}
            >
              {updateShippingMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}