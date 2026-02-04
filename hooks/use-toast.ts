import { useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  duration?: number;
}

interface ToastActionElement {
  altText: string;
  action: React.ReactNode;
}

export function useToast() {
  const toast = useCallback(
    (props?: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive' | 'success' | 'info';
      duration?: number;
      action?: ToastActionElement;
    }) => {
      // Defensive checks: ensure props exists
      if (!props || typeof props !== 'object') {
        console.log('Toast: Notification');
        return;
      }
      
      // Implementation stub - can be replaced with actual toast library
      const message = String(props.title || props.description || 'Notification');
      const variant = props.variant || 'default';
      
      try {
        if (variant === 'destructive') {
          console.error('[Error]', message);
        } else if (variant === 'success') {
          console.log('✓', message);
        } else {
          console.log(message);
        }
      } catch (err) {
        // Fallback if console logging fails
        if (typeof window !== 'undefined') {
          console.log('Toast:', message);
        }
      }
    },
    []
  );

  return {
    toast,
    dismiss: (toastId?: string) => {
      // Implementation stub
    },
  };
}