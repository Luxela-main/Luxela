import React from 'react';
import { Tab } from '@/types';

interface TabsNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = ['Product Information', 'Additional Information', 'Preview'];

  return (
    <div className="flex space-x-4 mb-6 border-b border-[#333]">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`text-sm px-4 py-2 ${activeTab === tab
              ? "border-b-2 border-purple-600 text-white"
              : "text-gray-400"
            }`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};