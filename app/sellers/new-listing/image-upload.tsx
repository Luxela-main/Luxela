import React from 'react';
import { Plus } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange }) => {
  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesChange([...images, ...files].slice(0, 4));
    }
  };

  const handleAdditionalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && images.length < 4) {
      onImagesChange([...images, ...files].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="col-span-5">
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-4">
          Product image or video* (Maximum of 4 images)
        </h3>
        <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#1a1a1a] h-72 relative">
          {images.length > 0 ? (
            <div className="w-full h-full relative">
              <img
                src={getImagePreview(images[0])}
                alt="Main product"
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(0)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 flex items-center justify-center mb-4">
                {/* <Upload className="h-8 w-8 text-purple-600" /> */}
                <img src="/images/seller/elements.svg" alt="upload icon" />
              </div>
              <p className="text-sm font-medium mb-1">
                Upload Image(s) or product videos
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Supported file formats are .png, .jpeg, .mp4
              </p>
              <p className="text-xs text-gray-400">Max file size: 10mb</p>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMainUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24 relative">
            {images[index] ? (
              <>
                <img
                  src={getImagePreview(images[index])}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleAdditionalUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={images.length >= 4}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;