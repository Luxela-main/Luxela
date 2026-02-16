'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/hooks/useToast';
import { generateInvoicePDF } from '@/utils/invoice-generator';
import type { Order } from '@/types/buyer';

interface UseInvoiceActionsOptions {
  onSuccess?: (filename: string) => void;
  onError?: (error: Error) => void;
}

export function useInvoiceActions(options: UseInvoiceActionsOptions = {}) {
  const toastHandler = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const downloadInvoice = useCallback(
    async (elementId: string, order: Order) => {
      setIsDownloading(true);
      setProgress(0);

      let progressInterval: NodeJS.Timeout | null = null;
      let resetTimeout: NodeJS.Timeout | null = null;

      try {
        // Simulate progress with proper capping at 90%
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            const increment = Math.random() * 25; // Reduced from 30
            const newProgress = Math.min(prev + increment, 90); // Cap at 90% during progress
            return newProgress;
          });
        }, 300);

        const filename = `invoice-${order.orderId}-${new Date().getTime()}.pdf`;
        const result = await generateInvoicePDF('invoice-content', order, {
          scale: 2,
          filename: filename,
        });

        // Clear progress interval before completion
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }

        if (!isMountedRef.current) return;

        // Set to 100% to show completion
        setProgress(100);
        toastHandler.success('Invoice downloaded successfully');
        options.onSuccess?.(result.filename);
        
        // Reset state after showing 100% briefly
        resetTimeout = setTimeout(() => {
          if (isMountedRef.current) {
            setProgress(0);
            setIsDownloading(false);
          }
        }, 1200);
      } catch (error) {
        // Cleanup intervals on error
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }

        if (!isMountedRef.current) return;

        console.error('Failed to download invoice:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to download invoice';
        
        toastHandler.error(errorMessage);
        options.onError?.(
          error instanceof Error ? error : new Error(errorMessage)
        );

        setProgress(0);
        setIsDownloading(false);
      }
    },
    [toastHandler, options]
  );

  const printInvoice = useCallback(
    async (elementId: string) => {
      try {
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error('Invoice element not found');
        }

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
          throw new Error('Failed to open print window');
        }

        // Clone and style the element for printing
        const clonedElement = element.cloneNode(true) as HTMLElement;
        clonedElement.style.padding = '20px';
        clonedElement.style.fontFamily = 'Arial, sans-serif';
        clonedElement.style.fontSize = '12px';

        printWindow.document.write('<!DOCTYPE html>');
        printWindow.document.write('<html><head><title>Invoice</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(clonedElement.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          // Close window after printing (optional)
          // printWindow.close();
        }, 250);

        if (isMountedRef.current) {
          toastHandler.success('Print dialog opened');
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error('Failed to print invoice:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to print invoice';
        
        toastHandler.error(errorMessage);
        options.onError?.(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    },
    [toastHandler, options]
  );

  const shareInvoice = useCallback(
    async (elementId: string, order: Order) => {
      try {
        // Check if Web Share API is available
        if (!navigator.share) {
          throw new Error('Share API not supported on this device');
        }

        const filename = `invoice-${order.orderId}.pdf`;
        
        // For web sharing, we can share the invoice details
        // Note: Direct file sharing requires the generateInvoicePDF result
        await navigator.share({
          title: `Invoice for Order ${order.orderId}`,
          text: `Order Total: ₦${(order.amountCents / 100).toLocaleString('en-NG', {
            minimumFractionDigits: 0,
          })}`,
          url: window.location.href,
        });

        if (isMountedRef.current) {
          toastHandler.success('Invoice shared successfully');
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        // Share API cancellation is not an error
        if (error instanceof Error && error.message !== 'Share cancelled') {
          console.error('Failed to share invoice:', error);
          toastHandler.error('Failed to share invoice');
        }
      }
    },
    [toastHandler]
  );

  return {
    downloadInvoice,
    printInvoice,
    shareInvoice,
    isDownloading,
    progress,
  };
}