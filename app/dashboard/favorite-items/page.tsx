import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Favorite Items | Luxela Dashboard",
  description: "Your favorite items list",
};

export default function FavoriteItemsPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <span className="text-[#7e7e7e]">Home</span>
        <ChevronRight className="w-4 h-4 text-[#7e7e7e]" />
        <span className="text-white">Favorite Items</span>
      </div>

      {/* Page Title */}
      <h1 className="text-white text-2xl font-semibold mb-8">Favorite Items</h1>

      {/* Placeholder Content */}
      <div className="bg-[#1a1a1a] rounded-lg p-8 border border-[#212121]">
        <p className="text-[#acacac]">Your favorite items will appear here.</p>
      </div>
    </div>
  );
}