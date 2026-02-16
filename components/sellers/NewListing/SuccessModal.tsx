'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
}

export function SuccessModal({ isOpen, onClose, productTitle = 'Your product' }: SuccessModalProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleViewListings = () => {
    setIsRedirecting(true);
    // Small delay to ensure queries are invalidated before navigating
    setTimeout(() => {
      router.push('/sellers/my-listings');
      onClose();
      setIsRedirecting(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-gray-800/50 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-full blur-xl"></div>
              <CheckCircle className="w-16 h-16 text-green-500 relative" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            Listing Created Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-gray-300 mt-3">
            <span className="font-semibold text-white">{productTitle}</span> has been added to your store and is ready for customers to see.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-8">
          <Button
            onClick={handleViewListings}
            disabled={isRedirecting}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isRedirecting ? 'Redirecting...' : 'View My Listings'}
          </Button>
          <Button
            onClick={onClose}
            disabled={isRedirecting}
            variant="outline"
            className="w-full bg-gray-900/50 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 rounded-xl cursor-pointer transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default SuccessModal;