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
  return {
    success: (msg: string) =>
      toast.success(msg, {
        ...baseOptions,
        className: 'border-l-green-500',
      }),
    error: (msg: string) =>
      toast.error(msg, {
        ...baseOptions,
        className: 'border-l-red-500',
      }),
    info: (msg: string) =>
      toast.info(msg, {
        ...baseOptions,
        className: 'border-l-blue-500',
      }),
    warning: (msg: string) =>
      toast.warning(msg, {
        ...baseOptions,
        className: 'border-l-yellow-500',
      }),
  };
};
