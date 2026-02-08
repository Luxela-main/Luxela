'use client';

interface Color {
  colorName: string;
  colorHex?: string;
}

interface ProductColorSelectorProps {
  colors: Color[];
  selectedColor?: string;
  onColorChange?: (colorName: string) => void;
}

const UI_COLOR_MAP: { [key: string]: string } = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  pink: '#ec4899',
  purple: '#a855f7',
  orange: '#f97316',
  black: '#000000',
  white: '#ffffff',
  brown: '#78350f',
  gray: '#6b7280',
};

export default function ProductColorSelector({
  colors,
  selectedColor,
  onColorChange,
}: ProductColorSelectorProps) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">Available Colors</label>
      <div className="flex flex-wrap gap-3">
        {colors.map((color, i) => {
          const name = color.colorName?.toLowerCase().trim() || '';
          const hexFromDb = color.colorHex?.startsWith('#') ? color.colorHex : null;
          const hexFromMap = UI_COLOR_MAP[name];
          const finalColor = hexFromDb || hexFromMap;
          const isSelected = selectedColor === color.colorName;

          return (
            <button
              key={i}
              onClick={() => onColorChange?.(color.colorName)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-[#8451E1]'
                  : 'border-[#333] hover:border-[#8451E1]/50'
              }`}
              style={{
                backgroundColor: finalColor ? finalColor + '20' : undefined,
                color: finalColor || '#dcdcdc',
              }}
            >
              <div className="flex items-center gap-2">
                {finalColor && (
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{
                      backgroundColor: finalColor,
                      borderColor: isSelected ? '#8451E1' : finalColor,
                    }}
                  />
                )}
                <span className="text-sm font-medium">{color.colorName}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}