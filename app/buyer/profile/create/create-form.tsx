import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastSvc } from "@/services/toast";
import { createClient } from "@supabase/supabase-js";
import { useProfile } from "@/context/ProfileContext"; 
import {
  uploadImage,
  deleteImage,
  validateImageFile,
} from "@/lib/upload-image";
import { X, Upload } from "lucide-react";
import {
  getAllCountries,
  getStatesForCountry,
} from "@/app/sellersAccountSetup/constants/formOptions";

const STORAGE_KEY = 'buyer_profile_form_data';

export default function CreateBuyerProfileForm() {
  const router = useRouter();
  const { setProfile } = useProfile();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const toastShownRef = useRef(false);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const uploadMutation = trpc.buyer.uploadProfilePicture.useMutation();

  const [initialValues, setInitialValues] = useState({
    username: "",
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    country: "",
    state: "",
    profilePicture: "",
  });

  // Restore form data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData && !toastShownRef.current) {
        const parsed = JSON.parse(savedData);
        setInitialValues(parsed);
        toastSvc.success('Your previous profile details have been restored');
        toastShownRef.current = true;
      }
    } catch (err) {
      // Silently fail
    } finally {
      setHydrated(true);
    }
  }, []);

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object({
      username: Yup.string().min(3).max(100).required("Username is required"),
      fullName: Yup.string().required("Full name is required"),
      country: Yup.string().required("Country is required"),
      state: Yup.string().required("State is required"),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      const response = await createProfileMutation.mutateAsync({
        username: values.username,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth
          ? new Date(values.dateOfBirth)
          : undefined,
        phoneNumber: values.phoneNumber || undefined,
        country: values.country,
        state: values.state,
        profilePicture: values.profilePicture || undefined,
      });
      return response;
    }
  });

  const countryOptions = getAllCountries();
  const selectedCountryCode = formik.values.country;
  const stateOptions = selectedCountryCode
    ? getStatesForCountry(selectedCountryCode).map((state) => ({
        value: state,
        label: state,
      }))
    : [];

  // Save form data to localStorage whenever values change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formik.values));
    } catch (err) {
      // Silently fail
    }
  }, [formik.values, hydrated]);

  const createProfileMutation = trpc.buyer.createBuyerProfile.useMutation({
    onSuccess: async (response) => {
      toastSvc.success("Buyer profile created successfully");
      
      // Clear saved form data on successful submission
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        // Silently fail
      }
      
      // Immediately set the created profile in context so page doesn't wait for server fetch
      if (response.profile) {
        setProfile(response.profile);
      }
      
      // Invalidate the profile query cache for future refreshes
      await utils.buyer.getAccountDetails.invalidate();
      
      // Redirect to profile page immediately
      setTimeout(() => {
        router.push("/buyer/profile");
      }, 300);
    },
    onError: (error: any): void => {
      // If profile already exists, redirect to profile page
      if (error.message?.includes("already exists")) {
        toastSvc.info("Your profile already exists");
        router.push("/buyer/profile");
        return;
      }
      toastSvc.error(error.message || "Failed to create profile");
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
      // Compress image using canvas
      const canvas = document.createElement('canvas');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          // Set canvas size to max 800x800
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = (height * maxDim) / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = (width * maxDim) / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 with quality 0.7
          const base64Data = canvas.toDataURL('image/jpeg', 0.7);
          const base64Only = base64Data.split(',')[1];
          
          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileType: 'image/jpeg',
            base64Data: base64Only,
          });
          
          formik.setFieldValue("profilePicture", result.url);
          toastSvc.success("Profile picture uploaded successfully");
        } catch (err: any) {
          toastSvc.error(err.message || "Failed to upload picture");
        } finally {
          URL.revokeObjectURL(objectUrl);
          setUploadingPicture(false);
          if (pictureInputRef.current) pictureInputRef.current.value = "";
        }
      };
      img.onerror = () => {
        toastSvc.error("Failed to load image");
        URL.revokeObjectURL(objectUrl);
        setUploadingPicture(false);
        if (pictureInputRef.current) pictureInputRef.current.value = "";
      };
      img.src = objectUrl;
    } catch (err: any) {
      toastSvc.error(err.message || "Failed to upload picture");
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = "";
    }
  };

  if (!hydrated) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md mx-auto mt-10">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md mx-auto mt-10">
      <h2 className="text-xl font-medium mb-6 text-white">
        Create Your Profile to Continue
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
          <select
            name="country"
            value={formik.values.country}
            onChange={(e) => {
              formik.setFieldValue("country", e.target.value);
              // Reset state when country changes
              formik.setFieldValue("state", "");
            }}
            onBlur={formik.handleBlur}
            className={`w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition ${
              formik.touched.country && formik.errors.country
                ? "border-red-500"
                : ""
            }`}
          >
            <option value="">Select a country</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formik.touched.country && formik.errors.country && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.country}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">State</label>
          {selectedCountryCode ? (
            <select
              name="state"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none transition ${
                formik.touched.state && formik.errors.state
                  ? "border-red-500"
                  : ""
              }`}
              disabled={stateOptions.length === 0}
            >
              <option value="">Select a state</option>
              {stateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full bg-[#222] border border-[#333] rounded px-3 py-2 text-gray-500">
              Please select a country first
            </div>
          )}
          {formik.touched.state && formik.errors.state && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.state}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">Profile Picture</label>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-purple-600 transition">
            {formik.values.profilePicture ? (
              <div className="relative w-24 h-24">
                <img
                  src={formik.values.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => formik.setFieldValue("profilePicture", "")}
                  className="absolute top-1 right-1 bg-red-500 p-1 rounded cursor-pointer hover:bg-red-600"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ) : (
              <div
                className="text-center cursor-pointer w-full"
                onClick={() => pictureInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 text-gray-500" size={32} />
                <p className="text-xs text-gray-400">Click to upload profile picture</p>
                <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={pictureInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureUpload}
            className="hidden"
          />
          {uploadingPicture && (
            <p className="text-xs text-gray-400 mt-2">Uploading picture...</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button
            type="submit"
            disabled={createProfileMutation.isPending || !formik.isValid}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
          >
            {createProfileMutation.isPending ? "Creating..." : "Create Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}