'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import PurchaseHistory from '@/components/buyer/profile/purchase-history';
import { useAuth } from '@/context/AuthContext';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('loyalty');
  const { user } = useAuth();


  if (!user) return null;

  const username =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  const userPicture =
    user.user_metadata?.avatar_url ||
    "/assets/image 38.png";

  const userSince = (user.created_at) ? new Date(user.created_at).getFullYear() : '2023';


  const nftItems = [
    { id: 1, rarity: 'Rare', property: 'Digital Art' },
    { id: 2, rarity: 'Epic', property: 'Collectible' },
    { id: 3, rarity: 'Common', property: 'Avatar' },
  ];

  return (
    <div className="min-h-screen text-white font-sans py-10">
      {/* Header */}
      <header className="flex flex-col gap-10 md:flex-row items-start justify-between px-2 ">
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="size-[60px] md:size-[120px] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
            <Image
              width={120}
              height={120}
              src={userPicture}
              alt="Profile"
              className="size-full object-cover"
            />
          </div>

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

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.a
            href='/account'
            whileHover={{ scale: 1.01, boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-b from-purple-600 to-purple-700 rounded-md text-sm font-medium transition-all"
          >
            Profile Settings
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gray-900 rounded-md text-sm font-medium border border-gray-800 transition-all"
          >
            View cart
          </motion.button>
        </motion.div>
      </header>

      {/* Tabs */}
      <div className="px-2 mt-12">
        <div className="flex justify-between md:gap-8 md:justify-start">
          <motion.button
            onClick={() => setActiveTab('loyalty')}
            className="relative pb-4 text-base font-semibold cursor-pointer"
            whileHover={{ y: -0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className={activeTab === 'loyalty' ? 'text-purple-400' : 'text-[#DCDCDC] hover:text-purple-400'}>
              Your loyalty NFTs
            </span>
            {activeTab === 'loyalty' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('purchase')}
            className="relative pb-4 text-base font-semibold cursor-pointer"
            whileHover={{ y: -0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <span className={activeTab === 'purchase' ? 'text-purple-400' : 'text-[#DCDCDC] hover:text-purple-400'}>
              Purchase history
            </span>
            {activeTab === 'purchase' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
        {activeTab === 'loyalty' && nftItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -1, transition: { type: "spring", stiffness: 400, damping: 10 } }}
            className="group cursor-pointer"
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg overflow-hidden border border-gray-800"
              whileHover={{ borderColor: "rgba(147, 51, 234, 0.5)" }}
            >
              <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0.5 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"
                />
                <span className="text-gray-600 text-sm relative z-10">Picture of NFT</span>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="z-[12] px-4 py-2 bg-purple-600 rounded-md text-sm font-medium"
                  >
                    View Details
                  </motion.button>
                </motion.div>
              </div>

              <div className="p-4">
                <motion.p
                  className="text-xs text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Rating/Property
                </motion.p>
                <div className="flex gap-2 mt-2">
                  <motion.span
                    className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(147, 51, 234, 0.3)" }}
                  >
                    {item.rarity}
                  </motion.span>
                  <motion.span
                    className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(75, 85, 99, 1)" }}
                  >
                    {item.property}
                  </motion.span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}

        {activeTab === 'purchase' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="col-span-full"
          >
            <PurchaseHistory />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;