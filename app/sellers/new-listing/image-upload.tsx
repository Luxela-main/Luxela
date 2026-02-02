import React, { useRef } from 'react';
import { Upload, Plus, X, GripVertical } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleMainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onImagesChange([files[0], ...images.slice(0, 5)]);
    }
  };

  const handleAdditionalUpload = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = [...images];
      newImages[index + 1] = files[0];
      onImagesChange(newImages);
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
      onImagesChange([imageFiles[0], ...images.slice(0, 5)]);
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
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white mb-1">
            Product images <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-gray-400">
            📸 Upload unlimited high-quality images to showcase your product from different angles
          </p>
        </div>

        {/* Image Grid: 1 Large Main + 5 Additional Tiles */}
        <div className="mb-8">
          {/* Main Image - Full Width */}
          <div className="mb-6">
            <div className="mb-2">
              <p className="text-sm font-semibold text-white">📌 Main Image</p>
              <p className="text-xs text-gray-400">Cover photo</p>
            </div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !images.length && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center bg-[#1a1a1a] h-56 relative transition cursor-pointer ${
                dragActive ? 'border-[#8451E1] bg-[#8451E1]/10' : 'border-gray-600'
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
                      className="bg-[#8451E1] text-white px-3 py-1.5 rounded-lg text-xs hover:bg-[#7340D0] font-medium transition"
                    >
                      Change
                    </button>
                  </div>
                  <button
                    onClick={() => removeImage(0)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mb-3 border border-[#8451E1]">
                    <Upload className="h-6 w-6 text-[#8451E1]" />
                  </div>
                  <p className="text-xs font-semibold text-white text-center mb-2">Drag or click</p>
                  <p className="text-xs text-gray-400 text-center">Max 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMainUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Additional Images Grid - Below Main Image */}
          <div>
            <p className="text-sm font-semibold text-white mb-2">📸 Add Other Images</p>
            <div className="grid grid-cols-5 gap-4">

              {[0, 1, 2, 3, 4].map((index) => (
                <div key={`tile-${index}`} className="col-span-1">
                  <p className="text-xs font-semibold text-white mb-1">Image {index + 2}</p>
                  <div
                    draggable={images[index + 1] ? true : false}
                    onDragStart={() => images[index + 1] && setDraggedIndex(index + 1)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null && draggedIndex !== index + 1) {
                        moveImage(draggedIndex, index + 1);
                        setDraggedIndex(null);
                      }
                    }}
                    className={`border-2 ${
                      images[index + 1] ? 'border-gray-600' : 'border-dashed border-gray-600'
                    } rounded-lg p-2 flex flex-col items-center justify-center bg-[#1a1a1a] h-40 relative transition ${
                      images[index + 1] ? 'cursor-move hover:border-[#8451E1]' : 'hover:border-[#8451E1]'
                    }`}
                  >
                    {images[index + 1] ? (
                      <div className="w-full h-full relative group">
                        <img
                          src={getImagePreview(images[index + 1])}
                          alt={`Product ${index + 2}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <GripVertical className="w-3 h-3 text-white" />
                        </div>
                        <button
                          onClick={() => removeImage(index + 1)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => additionalInputRefs.current[index]?.click()}
                          className="w-full h-full flex flex-col items-center justify-center hover:bg-[#8451E1]/5 transition rounded-lg"
                        >
                          <Plus className="h-5 w-5 text-[#8451E1] mb-1" />
                          <span className="text-xs text-[#8451E1] font-semibold">Add</span>
                        </button>
                        <input
                          ref={(ref) => {
                            additionalInputRefs.current[index] = ref;
                          }}
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleAdditionalUpload(index)}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-400 mt-4">
            ✓ You can upload up to <strong>6 images total</strong> (1 main + 5 additional)
          </p>
        </div>

        {/* Info Section */}
        <div className="bg-[#8451E1]/10 border border-[#8451E1]/30 rounded-lg p-4">
          <p className="text-xs text-[#8451E1] mb-3 font-semibold">
            ✨ Pro Tips for Better Visibility:
          </p>
          <ul className="text-xs text-gray-400 space-y-2">
            <li>📸 <strong>Upload 4+ images</strong> — Shows buyer commitment & increases trust</li>
            <li>💡 <strong>High-quality photos</strong> — Good lighting helps sell products</li>
            <li>🔄 <strong>Multiple angles</strong> — Front, back, side, detail shots</li>
            <li>⭐ <strong>Main image</strong> — Becomes your product thumbnail (make it count!)</li>
            <li>↕️ <strong>Drag to reorder</strong> — Arrange images in order of importance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;