"use client";

import { useState, useEffect } from "react";
import React from "react";
import { User, CheckCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { LoadingState } from "@/components/sellers/LoadingState";

interface ProfileAccountProps {
  initialData: any;
}

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  bio: Yup.string().optional(),
});

export function ProfileAccount({ initialData }: ProfileAccountProps) {
  const utils = trpc.useUtils();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const profileData = initialData;
  const hasProfile = !!profileData?.seller;

  const [idType, setIdType] = useState(profileData?.business?.idType || "national_id");
  const [idNumber, setIdNumber] = useState(profileData?.business?.idNumber || "");
  const [isVerified, setIsVerified] = useState(profileData?.business?.idVerified || false);
  const [profilePhoto, setProfilePhoto] = useState(profileData?.seller?.profilePhoto || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    setIdType(profileData?.business?.idType || "national_id");
    setIdNumber(profileData?.business?.idNumber || "");
    setIsVerified(profileData?.business?.idVerified || false);
    setProfilePhoto(profileData?.seller?.profilePhoto || "");
  }, [profileData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toastSvc.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toastSvc.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setIsUploadingPhoto(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase configuration missing");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        throw new Error("Authentication required");
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const sellerId = profileData?.seller?.id || "default";
      const filePath = `${sellerId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("seller-profiles")
        .upload(filePath, selectedFile, {
          upsert: true,
          contentType: selectedFile.type,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("seller-profiles")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update profile with new photo
      setProfilePhoto(publicUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      toastSvc.success("Photo uploaded successfully");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toastSvc.error(err?.message || "Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const createProfileMutation = trpc.seller.createSellerProfile.useMutation({
    onSuccess: () => {
      toastSvc.success("Profile created successfully");
      window.location.reload();
    },
    onError: (err: any) => {
      toastSvc.error(err.message || "Failed to create profile");
    },
  });

  const updateProfileMutation = trpc.seller.updateSellerBusiness.useMutation({
    onSuccess: () => {
      toastSvc.success("Profile updated successfully");
      utils.seller.getProfile.invalidate();
    },
    onError: (err: any) => {
      toastSvc.error(err.message || "Failed to update profile");
    },
  });

  const verifyMutation = trpc.seller.verifyId.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toastSvc.success("Verification Successful");
        utils.seller.getProfile.invalidate();
      } else {
        toastSvc.error(data.message);
      }
    },
    onError: (err: any) => {
      toastSvc.error(err.message || "Failed to verify ID");
    },
  });

  const [firstName, ...lastNameParts] = (
    profileData?.business?.fullName || ""
  ).split(" ");
  const lastName = lastNameParts.join(" ");

  const formik = useFormik({
    initialValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: profileData?.business?.officialEmail || "",
      phone: profileData?.business?.phoneNumber || "",
      bio: profileData?.business?.bio || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!hasProfile) {
        await createProfileMutation.mutateAsync();
        return;
      }

      await updateProfileMutation.mutateAsync({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        officialEmail: values.email,
        phoneNumber: values.phone,
        bio: values.bio,
        brandName: profileData.business?.brandName || "My Store",
        businessType: profileData.business?.businessType || "individual",
        businessAddress:
          profileData.business?.businessAddress || "Not provided",
        country: profileData.business?.country || "Nigeria",
        idType: idType,
        idNumber: idNumber,
        idVerified: isVerified,
        storeLogo: profilePhoto,
      });
    },
  });

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Profile Account</h2>

      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-[#222] rounded-full mr-6 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              variant="outline"
              className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white mb-2 cursor-pointer transition disabled:cursor-not-allowed"
            >
              {isUploadingPhoto ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
            {previewUrl && !isUploadingPhoto && (
              <div className="flex gap-2 mb-2">
                <Button
                  onClick={handleUploadPhoto}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 cursor-pointer text-white"
                >
                  Save Photo
                </Button>
                <Button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                  className="bg-[#222] border-[#333] hover:bg-[#333] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Recommended: 200x200px, Max 5MB
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2">First Name</label>
            <Input
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                formik.touched.firstName && formik.errors.firstName
                  ? "border-red-500"
                  : ""
              }`}
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.firstName as string}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm mb-2">Last Name</label>
            <Input
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
                formik.touched.lastName && formik.errors.lastName
                  ? "border-red-500"
                  : ""
              }`}
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.lastName as string}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">Email Address</label>
          <Input
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.email && formik.errors.email
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.email as string}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Phone Number</label>
          <Input
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.phone && formik.errors.phone
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.phone && formik.errors.phone && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.phone as string}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-2">Bio</label>
          <Textarea
            name="bio"
            value={formik.values.bio}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[100px]"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="border-t border-[#333] pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">ID Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2">ID Type</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as any)}
                className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 focus:border-purple-600 focus:ring-purple-600 cursor-pointer"
              >
                <option value="national_id">National ID (NIN)</option>
                <option value="passport">International Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="voters_card">Voter's Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2">ID Number</label>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                placeholder="Enter your ID number"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => verifyMutation.mutate({ idType, idNumber })}
              disabled={!idNumber || verifyMutation.isPending || isVerified}
              className={`cursor-pointer disabled:cursor-not-allowed transition ${
                isVerified
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {verifyMutation.isPending ? (
                "Verifying..."
              ) : isVerified ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified
                </>
              ) : (
                "Verify"
              )}
            </Button>
            {isVerified && (
              <span className="text-green-500 text-sm">Verification Successful</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {profilePhoto && (
            <Button
              onClick={() => {
                setProfilePhoto("");
                setPreviewUrl(null);
              }}
              type="button"
              variant="outline"
              className="bg-[#222] border-[#333] hover:bg-[#333] cursor-pointer text-red-400 hover:text-red-300"
            >
              Remove Photo
            </Button>
          )}
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer disabled:cursor-not-allowed transition"
            disabled={updateProfileMutation.isPending || !formik.isValid}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}