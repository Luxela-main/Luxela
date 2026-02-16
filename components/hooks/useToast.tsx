import { toast, ToastOptions, ToastContentProps, CloseButtonProps } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { X } from 'lucide-react';
import React from 'react';

const CustomCloseButton = ({ closeToast }: CloseButtonProps) => (
  <button
    onClick={closeToast}
    className="text-gray-500 hover:text-gray-800 absolute top-2 right-2"
  >
    <X size={16} />
  </button>
);

const baseOptions: ToastOptions = {
  position: 'top-center',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  closeButton: CustomCloseButton,
  className:
    'relative p-4 rounded-lg text-sm flex items-start shadow-lg bg-white text-gray-800 border-l-4',
};

// ✅ Custom toast hook
export const useToast = () => {
  const successHandler = (msg: string) => {
    try {
      toast.success(msg, {
        ...baseOptions,
        className: 'border-l-green-500',
      });
    } catch (e) {
      console.log('Success:', msg);
    }
  };

  const errorHandler = (msg: string) => {
    try {
      toast.error(msg, {
        ...baseOptions,
        className: 'border-l-red-500',
      });
    } catch (e) {
      console.error('Error:', msg);
    }
  };

  const infoHandler = (msg: string) => {
    try {
      toast.info(msg, {
        ...baseOptions,
        className: 'border-l-blue-500',
      });
    } catch (e) {
      console.info('Info:', msg);
    }
  };

  const warningHandler = (msg: string) => {
    try {
      toast.warning(msg, {
        ...baseOptions,
        className: 'border-l-yellow-500',
      });
    } catch (e) {
      console.warn('Warning:', msg);
    }
  };

  return {
    success: successHandler,
    error: errorHandler,
    info: infoHandler,
    warning: warningHandler,
  };
};