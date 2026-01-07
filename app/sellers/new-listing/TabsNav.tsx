// import React from 'react';
// import { Tab } from '@/types';

// interface TabsNavProps {
//   activeTab: Tab;
//   onTabChange: (tab: Tab) => void;
//   isProductInfoValid?: boolean;
//   isAdditionalInfoValid?: boolean;
// }

// export const TabsNav: React.FC<TabsNavProps> = ({ 
//   activeTab, 
//   onTabChange,
//   isProductInfoValid = false,
//   isAdditionalInfoValid = false
// }) => {
//   const tabs: Tab[] = ['Product Information', 'Additional Information', 'Preview'];

//   const isTabDisabled = (tab: Tab) => {
//     if (tab === 'Product Information') return false; // Always accessible
//     if (tab === 'Additional Information') return !isProductInfoValid;
//     if (tab === 'Preview') return !isAdditionalInfoValid;
//     return false;
//   };

//   return (
//     <div className="flex space-x-4 mb-6 border-b border-[#333]">
//       {tabs.map((tab) => {
//         const disabled = isTabDisabled(tab);
//         return (
//           <button
//             key={tab}
//             disabled={disabled}
//             className={`text-sm px-4 py-2 transition-all ${
//               activeTab === tab
//                 ? "border-b-2 border-purple-600 text-white"
//                 : disabled
//                 ? "text-gray-600 cursor-not-allowed opacity-50"
//                 : "text-gray-400 hover:text-white"
//             }`}
//             onClick={() => !disabled && onTabChange(tab)}
//           >
//             {tab}
//           </button>
//         );
//       })}
//     </div>
//   );
// };