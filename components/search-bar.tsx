import React from "react";
import { Search } from "lucide-react";

interface SearchProps {
  search?: string;
  setSearch?: (value: string) => void;
}

const SearchBar: React.FC<SearchProps> = ({ search, setSearch }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch && setSearch(e.target.value)}
          className="w-full bg-[#1e1e1e] border border-[#333] rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
        />
      </form>
    </div>
  );
};

export default SearchBar;
