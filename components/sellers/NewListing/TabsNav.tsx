// TabsNav.tsx
import React from 'react';
import { TabType } from '@/types/newListing';

interface TabsNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface Tab {
  id: TabType;
  label: string;
}

const TabsNav: React.FC<TabsNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    { id: 'product-info', label: 'Product Information' },
    { id: 'additional-info', label: 'Additional Information' },
    { id: 'preview', label: 'Preview' }
  ];

  return (
    <div className="flex items-center justify-end gap-8 border-b border-black mb-8 text-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-4 px-2 relative ${
            activeTab === tab.id ? 'text-purple-500' : 'text-gray-400'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabsNav;