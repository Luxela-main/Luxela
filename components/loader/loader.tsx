"use client";
import React from "react";
import { motion } from "framer-motion";
interface IProps {}

export const Loader: React.FC<IProps> = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <motion.div
        className="w-24 h-24 border-4 border-t-purple-500 border-b-purple-500 border-l-transparent border-r-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 1,
        }}
      />
    </div>
  );
};

export const SignInLoading = () => {
  return (
    <>
      <div className="animate-pulse">
        <div className="flex gap-4 justify-center align-center">
          <div className="w-3 h-3 border rounded-full bg-white"></div>
          <div className="w-3 h-3 border rounded-full bg-white"></div>
          <div className="w-3 h-3 border rounded-full bg-white"></div>
        </div>
      </div>
    </>
  );
};
