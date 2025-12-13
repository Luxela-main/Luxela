"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { LoadingState } from "@/components/sellers/LoadingState";

interface ProfileSettingsProps {
  initialData: any;
}

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  bio: Yup.string().optional(),
});

export function ProfileSettings({ initialData }: ProfileSettingsProps) {
  const [firstName, ...lastNameParts] = (
    initialData?.business?.fullName || ""
  ).split(" ");
  const lastName = lastNameParts.join(" ");
  const [images, setImages] = useState<File[]>([]);

  const utils = trpc.useUtils();

  const updateProfileMutation = (
    trpc.seller as any
  ).updateSellerBusiness.useMutation({
    onSuccess: () => {
      toastSvc.success("Profile updated successfully");
      (utils.seller as any).getProfile.invalidate();
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to update profile");
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: initialData?.business?.officialEmail || "",
      phone: initialData?.business?.phoneNumber || "",
      bio: initialData?.business?.bio || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateProfileMutation.mutateAsync({
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        officialEmail: values.email,
        phoneNumber: values.phone,
        bio: values.bio,
        // Preserve other required fields that are not in this form but required by backend
        brandName: initialData?.business?.brandName || "My Store", // Fallback if missing
        businessType: initialData?.business?.businessType || "individual",
        businessAddress:
          initialData?.business?.businessAddress || "Not provided",
        country: initialData?.business?.country || "Nigeria",
        idType: initialData?.business?.idType || "national_id",
      });
    },
  });

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Profile Settings</h2>

      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-[#222] rounded-full mr-6 flex items-center justify-center">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <div>
            <Button
              variant="outline"
              className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white mb-2"
            >
              Upload Photo
            </Button>
            <p className="text-xs text-gray-400">
              Recommended: 200x200px, Max 5MB
            </p>
          </div>
        </div>
      </div>
      {/* 
    <div className="mb-6">
  <div className="flex items-center mb-6">
    <div className="w-20 h-20 bg-[#222] rounded-full mr-6 flex items-center justify-center overflow-hidden">
      {images.length > 0 ? (
        <img 
          src={URL.createObjectURL(images[0])} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="h-10 w-10 text-gray-400" />
      )}
    </div>
    <div>
      <label htmlFor="profile-upload">
        <Button
          type="button"
          variant="outline"
          className="bg-[#222] border-[#333] hover:bg-[#333] hover:text-white mb-2 cursor-pointer"
          onClick={() => document.getElementById('profile-upload')?.click()}
        >
          Upload Photo
        </Button>
      </label>
      <input
        id="profile-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            setImages([files[0]]); // Only take first image for profile
          }
        }}
      />
      <p className="text-xs text-gray-400">
        Recommended: 200x200px, Max 5MB
      </p>
      {images.length > 0 && (
        <button
          type="button"
          onClick={() => setImages([])}
          className="text-xs text-red-400 hover:text-red-300 mt-1"
        >
          Remove photo
        </button>
      )}
    </div>
  </div>
</div> */}

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

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={updateProfileMutation.isPending || !formik.isValid}
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
