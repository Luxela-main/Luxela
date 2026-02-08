"use client";

import { useEffect } from "react";
import { useToast } from "@/components/hooks/useToast";

/**
 * Handles displaying pending toast messages that were stored in localStorage
 * before a page redirect (e.g., after Google OAuth sign-in)
 */
export function PendingToastHandler() {
  const toast = useToast();

  useEffect(() => {
    try {
      const pendingToastStr = localStorage.getItem("pendingToast");
      if (pendingToastStr) {
        const pendingToast = JSON.parse(pendingToastStr);
        
        if (pendingToast.type === "success") {
          toast.success(pendingToast.message);
        } else if (pendingToast.type === "error") {
          toast.error(pendingToast.message);
        } else if (pendingToast.type === "info") {
          toast.info(pendingToast.message);
        }
        
        // Clear the pending toast after displaying it
        localStorage.removeItem("pendingToast");
      }
    } catch (error) {
      console.error("Error handling pending toast:", error);
    }
  }, [toast]);

  // This component doesn't render anything
  return null;
}