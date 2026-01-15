"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toastSvc } from "@/services/toast";
import { useProfile } from "@/context/ProfileContext";
import { trpc } from "@/lib/trpc";

interface BillingAddressStepProps {
  onNext: () => void;
}

export function BillingAddressStep({ onNext }: BillingAddressStepProps) {
  const { profile, loading: profileLoading } = useProfile();

  // 1. Fetch existing addresses from the database
  const { data: existingAddresses, isLoading: fetchingAddresses } =
    trpc.buyer.getBillingAddresses.useQuery({
      page: 1,
      limit: 5,
    });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    saveInfo: false,
  });

  // 2. Priority Sync: Database Address > Profile Data > Default
  useEffect(() => {
    const dbAddress = existingAddresses?.data?.[0];
    const isProfileReady = profile && !profileLoading;

    if (dbAddress || isProfileReady) {
      setFormData((prev) => ({
        ...prev,
        fullName: profile?.fullName || profile?.name || prev.fullName,
        email: profile?.email || prev.email,
        phoneNumber: profile?.phoneNumber || prev.phoneNumber,
        state: profile?.state || prev.state,
        city: dbAddress?.city || profile?.city || prev.city,
        address: dbAddress?.houseAddress || profile?.address || prev.address,
        postalCode:
          dbAddress?.postalCode || profile?.postalCode || prev.postalCode,
      }));
    }
  }, [existingAddresses, profile, profileLoading]);

  const createAddressMutation = trpc.buyer.createBillingAddress.useMutation({
    onSuccess: () => {
      toastSvc.success("Shipping details confirmed");
      onNext();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to save shipping details");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createAddressMutation.mutate({
      houseAddress: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      isDefault: true,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (profileLoading || fetchingAddresses) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-400">Retrieving your shipping details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-6">
            Shipping details
          </h2>
          <div className="space-y-5">
            {/* FULL NAME */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full name
              </label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="bg-[#141414] border-gray-700 text-white"
              />
            </div>

            {/* EMAIL & PHONE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="bg-[#141414] border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone number
                </label>
                <Input
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="bg-[#141414] border-gray-700 text-white"
                />
              </div>
            </div>

            {/* STATE & CITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="bg-[#141414] border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="bg-[#141414] border-gray-700 text-white"
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                House address
              </label>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                className="bg-[#141414] border-gray-700 text-white resize-none"
              />
            </div>

            {/* POSTAL CODE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Postal code
              </label>
              <Input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                className="bg-[#141414] border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={createAddressMutation.isPending}
          className="w-full text-white py-6 text-sm"
        >
          {createAddressMutation.isPending
            ? "Processing..."
            : "Confirm shipping Address"}
        </Button>
      </form>
    </div>
  );
}
