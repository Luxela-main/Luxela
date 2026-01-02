import React from 'react';

interface ImagePreviewProps {
  images: File[];
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images }) => {
  return (
    <div className="col-span-5">
      {/* Main Image Section */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-4">
          Product Images ({images.length} of 4)
        </h3>
        <div className="border border-gray-600 rounded-lg p-8 flex items-center justify-center bg-[#1a1a1a] h-72">
          {images.length > 0 ? (
            <img
              src={URL.createObjectURL(images[0])}
              alt="Main product"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4 border border-gray-600 mx-auto">
                <span className="text-gray-400">No Image</span>
              </div>
              <p className="text-sm font-medium mb-1">No main image</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Images Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <div key={index} className="border border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
            {images[index] ? (
              <img
                src={URL.createObjectURL(images[index])}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                <span className="text-gray-400 text-xs">Empty</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePreview;