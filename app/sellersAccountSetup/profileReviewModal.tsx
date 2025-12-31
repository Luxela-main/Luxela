
// import React, { useState } from 'react';
// import { X } from 'lucide-react';

// // Modal Component
// const ProfileReviewModal = ({ isOpen, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Overlay */}
//       <div 
//         className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
//         onClick={onClose}
//       />
      
//       {/* Modal */}
//       <div className="relative z-10 w-full max-w-md mx-4">
//         <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md border-2 border-purple-500/50 rounded-2xl p-8 shadow-2xl">
//           {/* Close button */}
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
//           >
//             <X size={24} />
//           </button>

//           {/* Content */}
//           <div className="text-center space-y-6">
//             {/* Icon or Illustration */}
//             <div className="flex justify-center">
//               <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
//                 <svg
//                   className="w-8 h-8 text-purple-400"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                   />
//                 </svg>
//               </div>
//             </div>

//             {/* Title */}
//             <h2 className="text-2xl font-bold text-white">
//               Your seller profile is under review!
//             </h2>

//             {/* Description */}
//             <p className="text-gray-300 text-sm leading-relaxed">
//               Thanks for setting up your Profile! We're reviewing your profile and
//               will notify you within 72 hours once you're approved to start
//               selling.
//             </p>

//             {/* Button */}
//             <button
//               onClick={onClose}
//               className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
//             >
//               Got it
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Demo Component showing usage
// const Demo = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // Simulate successful profile creation
//   const handleProfileSubmit = async () => {
//     // Your profile creation logic here
//     // await createSellerProfile(...)
    
//     // After successful creation, show modal
//     setIsModalOpen(true);
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
//       <div className="text-center space-y-4">
//         <h1 className="text-white text-2xl font-bold">Seller Profile Setup Demo</h1>
//         <button
//           onClick={handleProfileSubmit}
//           className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
//         >
//           Submit Profile (Trigger Modal)
//         </button>
//       </div>

//       <ProfileReviewModal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//       />
//     </div>
//   );
// };

// export default Demo;