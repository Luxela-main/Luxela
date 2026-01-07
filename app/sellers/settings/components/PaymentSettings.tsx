// "use client";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useFormik } from "formik";
// import * as Yup from "yup";
// import { trpc } from "@/lib/trpc";
// import { toastSvc } from "@/services/toast";

// interface PaymentSettingsProps {
//   initialData: any;
// }

// const validationSchema = Yup.object({
//   preferredPayoutMethod: Yup.string().required("Preferred payout method is required"),
// });

// export function PaymentSettings({ initialData }: PaymentSettingsProps) {
//   const utils = trpc.useUtils();
  
//   const updatePaymentMutation = (trpc.seller as any).updateSellerPayment.useMutation({
//     onSuccess: () => {
//       toastSvc.success("Payment settings updated successfully");
//       (utils.seller as any).getProfile.invalidate();
//     },
//     onError: (error: any) => {
//       toastSvc.error(error.message || "Failed to update payment settings");
//     },
//   });

//   const formik = useFormik({
//     initialValues: {
//       preferredPayoutMethod: initialData?.payment?.preferredPayoutMethod || "fiat_currency",
//       fiatPayoutMethod: initialData?.payment?.fiatPayoutMethod || "bank",
//       bankCountry: initialData?.payment?.bankCountry || "",
//       accountHolderName: initialData?.payment?.accountHolderName || "",
//       accountNumber: initialData?.payment?.accountNumber || "",
//       walletType: initialData?.payment?.walletType || "phantom",
//       walletAddress: initialData?.payment?.walletAddress || "",
//       preferredPayoutToken: initialData?.payment?.preferredPayoutToken || "USDT",
//     },
//     validationSchema,
//     enableReinitialize: true,
//     onSubmit: async (values) => {
//       await updatePaymentMutation.mutateAsync({
//         preferredPayoutMethod: values.preferredPayoutMethod as any,
//         fiatPayoutMethod: values.fiatPayoutMethod as any || undefined,
//         bankCountry: values.bankCountry || undefined,
//         accountHolderName: values.accountHolderName || undefined,
//         accountNumber: values.accountNumber || undefined,
//         walletType: values.walletType as any || undefined,
//         walletAddress: values.walletAddress || undefined,
//         preferredPayoutToken: values.preferredPayoutToken as any || undefined,
//       });
//     },
//   });

//   return (
//     <div className="bg-[#1a1a1a] rounded-lg p-6">
//       <h2 className="text-xl font-medium mb-6">Payment Settings</h2>

//       <form onSubmit={formik.handleSubmit} className="space-y-6">
//         <div>
//           <label className="block text-sm mb-2">Preferred Payout Method</label>
//           <select
//             name="preferredPayoutMethod"
//             value={formik.values.preferredPayoutMethod}
//             onChange={formik.handleChange}
//             onBlur={formik.handleBlur}
//             className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:ring-purple-600"
//           >
//             <option value="fiat_currency">Fiat Currency</option>
//             <option value="cryptocurrency">Cryptocurrency</option>
//             <option value="both">Both</option>
//           </select>
//         </div>

//         {(formik.values.preferredPayoutMethod === "fiat_currency" || formik.values.preferredPayoutMethod === "both") && (
//           <div className="space-y-4 border-t border-gray-700 pt-4">
//             <h3 className="text-lg font-medium text-gray-300">Fiat Payment Details</h3>
            
//             <div>
//               <label className="block text-sm mb-2">Payout Method</label>
//               <select
//                 name="fiatPayoutMethod"
//                 value={formik.values.fiatPayoutMethod}
//                 onChange={formik.handleChange}
//                 className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:ring-purple-600"
//               >
//                 <option value="bank">Bank Transfer</option>
//                 <option value="paypal">PayPal</option>
//                 <option value="stripe">Stripe</option>
//                 <option value="flutterwave">Flutterwave</option>
//               </select>
//             </div>

//             {formik.values.fiatPayoutMethod === "bank" && (
//               <>
//                 <div>
//                   <label className="block text-sm mb-2">Bank Country</label>
//                   <Input
//                     name="bankCountry"
//                     value={formik.values.bankCountry}
//                     onChange={formik.handleChange}
//                     className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-2">Account Holder Name</label>
//                   <Input
//                     name="accountHolderName"
//                     value={formik.values.accountHolderName}
//                     onChange={formik.handleChange}
//                     className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-2">Account Number</label>
//                   <Input
//                     name="accountNumber"
//                     value={formik.values.accountNumber}
//                     onChange={formik.handleChange}
//                     className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//         )}

//         {(formik.values.preferredPayoutMethod === "cryptocurrency" || formik.values.preferredPayoutMethod === "both") && (
//           <div className="space-y-4 border-t border-gray-700 pt-4">
//             <h3 className="text-lg font-medium text-gray-300">Crypto Payment Details</h3>
            
//             <div>
//               <label className="block text-sm mb-2">Wallet Type</label>
//               <select
//                 name="walletType"
//                 value={formik.values.walletType}
//                 onChange={formik.handleChange}
//                 className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:ring-purple-600"
//               >
//                 <option value="phantom">Phantom</option>
//                 <option value="solflare">Solflare</option>
//                 <option value="backpack">Backpack</option>
//                 <option value="wallet_connect">WalletConnect</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm mb-2">Wallet Address</label>
//               <Input
//                 name="walletAddress"
//                 value={formik.values.walletAddress}
//                 onChange={formik.handleChange}
//                 className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
//               />
//             </div>

//             <div>
//               <label className="block text-sm mb-2">Preferred Token</label>
//               <select
//                 name="preferredPayoutToken"
//                 value={formik.values.preferredPayoutToken}
//                 onChange={formik.handleChange}
//                 className="w-full bg-[#222] border border-[#333] rounded-md px-3 py-2 text-white focus:border-purple-600 focus:ring-purple-600"
//               >
//                 <option value="USDT">USDT</option>
//                 <option value="USDC">USDC</option>
//                 <option value="solana">Solana (SOL)</option>
//               </select>
//             </div>
//           </div>
//         )}

//         <div className="flex justify-end">
//           <Button 
//             type="submit" 
//             className="bg-purple-600 hover:bg-purple-700"
//             disabled={updatePaymentMutation.isPending}
//           >
//             {updatePaymentMutation.isPending ? "Saving..." : "Save Changes"}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }
