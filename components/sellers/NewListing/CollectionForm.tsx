const TabsNav = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  const tabs = [
    { id: 'product-info', label: 'Product Information' },
    { id: 'additional-info', label: 'Additional Information' },
    { id: 'preview', label: 'Preview' }
  ];

  return (
    <div className="flex items-center gap-8 border-b border-[#333] mb-8">
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