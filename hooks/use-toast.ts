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
    (props: {
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive' | 'success' | 'info';
      duration?: number;
      action?: ToastActionElement;
    }) => {
      // Implementation stub - can be replaced with actual toast library
      const message = props.title || props.description || 'Notification';
      
      if (props.variant === 'destructive') {
        console.error(message);
      } else if (props.variant === 'success') {
        console.log('✓', message);
      } else {
        console.log(message);
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