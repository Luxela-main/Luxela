"use client";

import { useState, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastSvc } from "@/services/toast";
import {
  uploadImage,
  deleteImage,
  validateImageFile,
} from "@/lib/upload-image";
import { X, Upload } from "lucide-react";

export function CreateBuyerProfileForm() {
  const utils = trpc.useUtils();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const createProfileMutation = trpc.buyer.createBuyerProfile.useMutation({
    onSuccess: () => {
      toastSvc.success("Buyer profile created successfully");
      utils.buyer.getAccountDetails.invalidate();
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to create profile");
    },
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      fullName: "",
      dateOfBirth: "",
      phoneNumber: "",
      country: "",
      state: "",
      profilePicture: "",
    },
    validationSchema: Yup.object({
      username: Yup.string().min(3).max(100).required("Username is required"),
      fullName: Yup.string().required("Full name is required"),
      country: Yup.string().required("Country is required"),
      state: Yup.string().required("State is required"),
    }),
    onSubmit: async (values) => {
      await createProfileMutation.mutateAsync({
        username: values.username,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth
          ? new Date(values.dateOfBirth)
          : undefined,
        phoneNumber: values.phoneNumber || undefined,
        country: values.country,
        state: values.state,
      });
    },
  });

  const uploadPictureMutation = trpc.buyer.uploadProfilePicture.useMutation({
    onSuccess: (data) => {
      formik.setFieldValue("profilePicture", data.url);
      toastSvc.success("Profile picture uploaded successfully");
    },
    onError: (error: any) => {
      toastSvc.error(error.message || "Failed to upload picture");
    },
  });

  const handlePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      if (pictureInputRef.current) pictureInputRef.current.value = "";
      return;
    }

    setUploadingPicture(true);
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:image/xxx;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await uploadPictureMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        base64Data: base64Data,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toastSvc.error(err.message || "Failed to upload picture");
    } finally {
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = "";
    }
  };

  const removePicture = () => {
    formik.setFieldValue("profilePicture", "");
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-medium mb-6 text-white">
        Create Your Buyer Profile
      </h2>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-400">Username</label>
          <Input
            name="username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.username && formik.errors.username
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.username && formik.errors.username && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.username}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">Full Name</label>
          <Input
            name="fullName"
            value={formik.values.fullName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.fullName && formik.errors.fullName
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.fullName && formik.errors.fullName && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.fullName}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">
            Date of Birth
          </label>
          <Input
            type="date"
            name="dateOfBirth"
            value={formik.values.dateOfBirth}
            onChange={formik.handleChange}
            className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">
            Phone Number
          </label>
          <Input
            type="tel"
            name="phoneNumber"
            value={formik.values.phoneNumber}
            onChange={formik.handleChange}
            className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">Country</label>
          <Input
            name="country"
            value={formik.values.country}
            onChange={formik.handleChange}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.country && formik.errors.country
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.country && formik.errors.country && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.country}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">State</label>
          <Input
            name="state"
            value={formik.values.state}
            onChange={formik.handleChange}
            className={`bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 ${
              formik.touched.state && formik.errors.state
                ? "border-red-500"
                : ""
            }`}
          />
          {formik.touched.state && formik.errors.state && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.state}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#222] overflow-hidden relative flex items-center justify-center">
              {formik.values.profilePicture ? (
                <>
                  <img
                    src={formik.values.profilePicture}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removePicture();
                    }}
                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="text-gray-400">No picture</div>
              )}
            </div>
            <input
              ref={pictureInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handlePictureUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                pictureInputRef.current?.click();
              }}
              disabled={uploadingPicture}
              className="bg-[#222] border-[#333] hover:bg-[#333]"
            >
              {uploadingPicture ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            disabled={createProfileMutation.isPending || !formik.isValid}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
