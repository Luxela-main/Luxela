import React, { useRef } from 'react';
import { Upload, Plus, X, GripVertical } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesChange([...images, ...files]);
    }
  };

  const handleAdditionalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesChange([...images, ...files]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      onImagesChange([...images, ...imageFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
    onImagesChange(newImages);
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="col-span-5">
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-4">
          Product images <span className="text-red-500">*</span> (Upload unlimited images)
        </h3>

        {/* Main Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-[#1a1a1a] h-72 relative transition ${
            dragActive ? 'border-purple-500 bg-purple-900/10' : 'border-gray-600'
          }`}
        >
          {images.length > 0 ? (
            <div className="w-full h-full relative group">
              <img
                src={getImagePreview(images[0])}
                alt="Main product"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                >
                  Change Main Image
                </button>
              </div>
              <button
                onClick={() => removeImage(0)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-red-600 transition shadow-lg"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4 border border-purple-600">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium mb-1">Upload images or product videos</p>
              <p className="text-xs text-gray-400 mb-2">
                Supported: .png, .jpeg, .webp, .mp4
              </p>
              <p className="text-xs text-gray-400 mb-4">Max file size: 10MB per image</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm transition"
              >
                Select Images
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMainUpload}
            className="hidden"
          />
        </div>

        {/* Additional Images Grid */}
        {images.length > 1 && (
          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-3">
              {images.length} image{images.length !== 1 ? 's' : ''} added
            </p>
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1).map((image, index) => (
                <div
                  key={index + 1}
                  draggable
                  onDragStart={() => setDraggedIndex(index + 1)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== index + 1) {
                      moveImage(draggedIndex, index + 1);
                      setDraggedIndex(null);
                    }
                  }}
                  className="relative group border border-gray-600 rounded-lg overflow-hidden bg-[#0a0a0a] aspect-square cursor-move hover:border-purple-500 transition"
                >
                  <img
                    src={getImagePreview(image)}
                    alt={`Product ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>
                  <button
                    onClick={() => removeImage(index + 1)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add More Images Button */}
              <button
                onClick={() => additionalInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-[#0a0a0a] aspect-square hover:border-purple-500 hover:bg-purple-900/5 transition"
              >
                <Plus className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400 text-center">Add more</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden additional input */}
        <input
          ref={additionalInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleAdditionalUpload}
          className="hidden"
        />
      </div>

      {/* Info Section */}
      <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-2">
          <strong>💡 Tips for better listings:</strong>
        </p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Upload 4+ images for better visibility</li>
          <li>• Use high-quality, well-lit photos</li>
          <li>• Show product from multiple angles</li>
          <li>• First image will be the main thumbnail</li>
          <li>• Drag images to reorder them</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUpload;