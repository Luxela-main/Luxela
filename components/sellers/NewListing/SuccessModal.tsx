'use client';

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

  const handleViewListings = () => {
    router.push('/sellers/my-listings');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <DialogTitle className="text-center text-lg font-semibold">
            Product listed successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            {productTitle} has been added to your store and is now visible to customers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleViewListings}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            View My Listings
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default SuccessModal;