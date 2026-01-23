"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PurchaseHistory from "@/components/buyer/profile/purchase-history";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { trpc } from "@/lib/trpc";
import { validateImageFile } from "@/lib/upload-image";
import { toastSvc } from "@/services/toast";
import { Edit } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const ProfileContent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"loyalty" | "purchase">("loyalty");
  const { user } = useAuth();
  const { profile, loading: profileLoading, isInitialized } = useProfile();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const handleProfilePicUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toastSvc.error(
        "Invalid file type. Please upload a PNG, JPEG, or WebP image."
      );
      if (profilePicInputRef.current) profilePicInputRef.current.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toastSvc.error(
        "Image is too large. Maximum size is 5MB. Please choose a smaller image."
      );
      if (profilePicInputRef.current) profilePicInputRef.current.value = "";
      return;
    }

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      toastSvc.error(validation.error!);
      if (profilePicInputRef.current) profilePicInputRef.current.value = "";
      return;
    }

    setUploadingProfilePic(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Get auth token from Supabase
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );

      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/upload/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      toastSvc.success("Profile picture updated successfully");
      await utils.buyer.getAccountDetails.invalidate();
    } catch (err: any) {
      toastSvc.error(err.message || "Failed to upload profile picture");
    } finally {
      setUploadingProfilePic(false);
      if (profilePicInputRef.current) profilePicInputRef.current.value = "";
    }
  };

  if (profileLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const username =
    profile.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const userSince = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : "2023";

  const nftItems = [
    { id: 1, rarity: "Rare", property: "Digital Art" },
    { id: 2, rarity: "Epic", property: "Collectible" },
    { id: 3, rarity: "Common", property: "Avatar" },
  ];

  return (
    <div className="min-h-screen text-white px-6 py-10">
      {/* Header */}
      <header className="flex flex-col gap-10 md:flex-row items-start justify-between px-2">
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-[60px] md:w-[120px] h-[60px] md:h-[120px] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
            <img
              key={profile?.id}
              src={profile?.profilePicture ? `${profile.profilePicture}?v=${Date.now()}` : "/images/seller/sparkles.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                profilePicInputRef.current?.click();
              }}
              className="absolute bottom-1 right-1 bg-purple-600 p-2 rounded-full hover:bg-purple-700 transition-colors"
              disabled={uploadingProfilePic}
            >
              {uploadingProfilePic ? (
                <span className="text-xs">...</span>
              ) : (
                <Edit className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          <input
            ref={profilePicInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleProfilePicUpload}
            className="hidden"
          />

          <div className="flex flex-col gap-4">
            <div>
              <motion.h1
                className="text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {username}
              </motion.h1>
              <motion.p
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Member since {userSince}
              </motion.p>
            </div>
            <motion.p
              className="text-base rounded-full border border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20 px-4 py-1 inline-block"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-purple-400 font-medium">500 points</span>
              <span className="text-gray-500"> to rank the </span>
              <span className="text-purple-400 font-medium">Luxela NFT</span>
            </motion.p>
          </div>
        </motion.div>
      </header>

      {/* Tabs */}
      <div className="px-2 mt-12">
        <div className="flex justify-between md:gap-8 md:justify-start">
          <motion.button
            onClick={() => setActiveTab("loyalty")}
            className="relative pb-4 text-base font-semibold cursor-pointer"
            whileHover={{ y: -0.5 }}
          >
            <span
              className={
                activeTab === "loyalty"
                  ? "text-purple-400"
                  : "text-[#DCDCDC] hover:text-purple-400"
              }
            >
              Your loyalty NFTs
            </span>
            {activeTab === "loyalty" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                initial={false}
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("purchase")}
            className="relative pb-4 text-base font-semibold cursor-pointer"
            whileHover={{ y: -0.5 }}
          >
            <span
              className={
                activeTab === "purchase"
                  ? "text-purple-400"
                  : "text-[#DCDCDC] hover:text-purple-400"
              }
            >
              Purchase history
            </span>
            {activeTab === "purchase" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                initial={false}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* NFT Grid */}
      <motion.div
        className="px-2 mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {activeTab === "loyalty" &&
          nftItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg overflow-hidden border border-gray-800 p-4">
                <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">NFT Placeholder</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded">
                    {item.rarity}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                    {item.property}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

        {activeTab === "purchase" && (
          <motion.div className="col-span-full">
            <PurchaseHistory />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileContent;