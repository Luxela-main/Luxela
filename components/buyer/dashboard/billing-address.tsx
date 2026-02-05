"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "../../ui/card"
import { useProfile } from "@/context/ProfileContext"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { toastSvc } from "@/services/toast"

export function BillingAddress() {
  const { profile, loading, refreshProfile } = useProfile();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    houseAddress: "",
    city: "",
    postalCode: "",
  });

  const utils = trpc.useUtils();

  const createBillingAddressMutation = trpc.buyer.createBillingAddress.useMutation({
    onSuccess: () => {
      toastSvc.success("Billing address created successfully");
      setIsEditing(false);
      refreshProfile();
      utils.buyer.getAccountDetails.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to create billing address");
    },
  });

  const updateBillingAddressMutation = trpc.buyer.updateBillingAddress.useMutation({
    onSuccess: () => {
      toastSvc.success("Billing address updated successfully");
      setIsEditing(false);
      refreshProfile();
      utils.buyer.getAccountDetails.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to update billing address");
    },
  });

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-2 border-[#BEE3EC]/30 bg-gradient-to-br from-[#BEE3EC]/5 to-transparent p-6">
        <h2 className="text-white text-lg font-semibold mb-6">Billing Address</h2>
        <div className="text-[#7e7e7e]">Loading billing address...</div>
      </Card>
    );
  }

  const billingAddress = profile?.billingAddress;

  const handleEdit = () => {
    if (billingAddress) {
      setFormData({
        houseAddress: billingAddress.houseAddress,
        city: billingAddress.city,
        postalCode: billingAddress.postalCode,
      });
    } else {
      setFormData({
        houseAddress: "",
        city: "",
        postalCode: "",
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      houseAddress: "",
      city: "",
      postalCode: "",
    });
  };

  const handleSave = async () => {
    if (!formData.houseAddress || !formData.city || !formData.postalCode) {
      toastSvc.error("Please fill in all fields");
      return;
    }

    if (billingAddress) {
      // Update existing address
      await updateBillingAddressMutation.mutateAsync({
        addressId: billingAddress.id,
        houseAddress: formData.houseAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        isDefault: true,
      });
    } else {
      // Create new address
      await createBillingAddressMutation.mutateAsync({
        houseAddress: formData.houseAddress,
        city: formData.city,
        postalCode: formData.postalCode,
        isDefault: true,
      });
    }
  };

  const isLoading = createBillingAddressMutation.isPending || updateBillingAddressMutation.isPending;

  return (
    <Card className="bg-[#1a1a1a] border-2 border-l-4 border-l-[#BEECE3] border-t-[#BEE3EC] border-r-[#EA795B] border-[#BEECE3]/30 bg-gradient-to-br from-[#BEECE3]/5 via-[#BEE3EC]/3 to-transparent p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#BEECE3] via-[#ECBEE3] to-[#BEE3EC]">Billing Address</h2>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            className="border-[#8451e1] text-[#8451e1] hover:bg-[#8451e1] hover:text-white bg-transparent"
            onClick={handleEdit}
          >
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#333] text-white hover:bg-[#333]"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#8451e1] hover:bg-[#7341c1] text-white"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">House address</label>
          {isEditing ? (
            <Input
              value={formData.houseAddress}
              onChange={(e) => setFormData({ ...formData, houseAddress: e.target.value })}
              className="bg-[#222] border-[#333] focus:border-[#8451e1] focus:ring-[#8451e1] text-white"
              placeholder="Enter house address"
            />
          ) : (
            <p className="text-white leading-relaxed">
              {billingAddress?.houseAddress || 'N/A'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">City of residence</label>
            {isEditing ? (
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-[#222] border-[#333] focus:border-[#8451e1] focus:ring-[#8451e1] text-white"
                placeholder="Enter city"
              />
            ) : (
              <p className="text-white">{billingAddress?.city || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Postal address</label>
            {isEditing ? (
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="bg-[#222] border-[#333] focus:border-[#8451e1] focus:ring-[#8451e1] text-white"
                placeholder="Enter postal code"
              />
            ) : (
              <p className="text-white">{billingAddress?.postalCode || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Phone Number</label>
            <p className="text-white">{profile?.phoneNumber || 'N/A'}</p>
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Email Address</label>
            <p className="text-white break-all">{profile?.email || user?.email || 'N/A'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}