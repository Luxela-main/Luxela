"use client";

import { useState } from "react";
import { X, CreditCard, Wallet, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddPayoutMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (method: any) => void;
}

export function AddPayoutMethodModal({ isOpen, onClose, onAdd }: AddPayoutMethodModalProps) {
  const [methodType, setMethodType] = useState<"bank" | "paypal" | "crypto" | "wise" | null>(null);
  const [formData, setFormData] = useState({
    // Bank transfer fields
    bankCountry: "",
    bankName: "",
    bankCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    swiftCode: "",
    iban: "",
    
    // PayPal
    email: "",
    
    // Wise
    wiseEmail: "",
    
    // Crypto
    walletNetwork: "",
    walletAddress: "",
    walletType: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // List of African countries for account type mapping
  const africanCountries = [
    'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Cameroon',
    'Senegal', 'Côte d\'Ivoire', 'Egypt', 'South Africa', 'Ethiopia', 'Sudan',
    'Angola', 'Botswana', 'Burkina Faso', 'Burundi', 'Cape Verde', 'Chad',
    'Comoros', 'Congo', 'Djibouti', 'Equatorial Guinea', 'Eritrea', 'Eswatini',
    'Gabon', 'Gambia', 'Guinea', 'Guinea-Bissau', 'Lesotho', 'Liberia',
    'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
    'Mozambique', 'Namibia', 'Niger', 'Republic of the Congo', 'São Tomé and Príncipe',
    'Seychelles', 'Sierra Leone', 'Somalia', 'South Sudan', 'Togo', 'Tunisia',
    'Zambia', 'Zimbabwe'
  ];

  const isAfricanCountry = (country: string): boolean => {
    return africanCountries.some(ac => ac.toLowerCase() === country.toLowerCase());
  };

  const getAccountTypeOptions = (): { value: string; label: string }[] => {
    const isAfrican = isAfricanCountry(formData.bankCountry);
    
    if (isAfrican) {
      return [
        { value: 'Current Account', label: 'Current Account' },
        { value: 'Savings Account', label: 'Savings Account' },
        { value: 'Fixed Deposit', label: 'Fixed Deposit' },
        { value: 'Call Deposit', label: 'Call Deposit' },
      ];
    } else {
      return [
        { value: 'Checking', label: 'Checking' },
        { value: 'Savings', label: 'Savings' },
        { value: 'Business', label: 'Business' },
      ];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    
    // If bank country changed, reset account type since options change
    if (name === 'bankCountry') {
      updatedData.accountType = '';
    }
    
    setFormData((prev) => ({ ...prev, ...updatedData }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    switch (methodType) {
      case "bank":
        if (!formData.bankName.trim()) errors.bankName = "Bank name is required";
        if (!formData.accountHolderName.trim()) errors.accountHolderName = "Account holder name is required";
        if (!formData.accountNumber.trim()) errors.accountNumber = "Account number is required";
        if (!formData.accountType.trim()) errors.accountType = "Account type is required";
        break;
      case "paypal":
        if (!formData.email.trim()) {
          errors.email = "PayPal email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = "Please enter a valid email address";
        }
        break;
      case "crypto":
        if (!formData.walletNetwork.trim()) errors.walletNetwork = "Network/Token selection is required";
        if (!formData.walletType.trim()) errors.walletType = "Wallet type is required";
        if (!formData.walletAddress.trim()) {
          errors.walletAddress = "Wallet address is required";
        } else if (formData.walletAddress.trim().length < 20) {
          errors.walletAddress = "Wallet address appears to be invalid (too short)";
        }
        break;
      case "wise":
        if (!formData.wiseEmail.trim()) {
          errors.wiseEmail = "Wise email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.wiseEmail)) {
          errors.wiseEmail = "Please enter a valid email address";
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let newMethod;

    switch (methodType) {
      case "bank":
        newMethod = {
          type: "bank",
          accountDetails: {
            bankCountry: formData.bankCountry || null,
            bankName: formData.bankName,
            bankCode: formData.bankCode || null,
            accountHolderName: formData.accountHolderName,
            accountNumber: formData.accountNumber,
            accountType: formData.accountType,
            swiftCode: formData.swiftCode || null,
            iban: formData.iban || null,
          },
          isDefault: false,
        };
        break;
      case "paypal":
        newMethod = {
          type: "paypal",
          accountDetails: {
            email: formData.email,
          },
          isDefault: false,
        };
        break;
      case "crypto":
        newMethod = {
          type: "other",
          accountDetails: {
            walletNetwork: formData.walletNetwork,
            walletAddress: formData.walletAddress,
            walletType: formData.walletType,
          },
          isDefault: false,
        };
        break;
      case "wise":
        newMethod = {
          type: "wise",
          accountDetails: {
            email: formData.wiseEmail,
          },
          isDefault: false,
        };
        break;
      default:
        return;
    }

    onAdd(newMethod);
    resetForm();
  };

  const resetForm = () => {
    setMethodType(null);
    setFormData({
      bankCountry: "",
      bankName: "",
      bankCode: "",
      accountHolderName: "",
      accountNumber: "",
      accountType: "",
      swiftCode: "",
      iban: "",
      email: "",
      wiseEmail: "",
      walletNetwork: "",
      walletAddress: "",
      walletType: "",
    });
    setValidationErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Add Payout Method</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#0a0a0a] rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        {!methodType ? (
          <div className="space-y-3">
            <p className="text-gray-400 mb-4">Select a payment method type:</p>

            <button
              onClick={() => setMethodType("bank")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-purple-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="text-purple-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Bank Transfer</h4>
                  <p className="text-sm text-gray-400">Direct bank account transfer</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("paypal")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-blue-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-blue-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">PayPal</h4>
                  <p className="text-sm text-gray-400">Send to your PayPal account</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("crypto")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-green-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Cryptocurrency</h4>
                  <p className="text-sm text-gray-400">USDC stablecoin on Solana network</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethodType("wise")}
              className="w-full p-4 border border-[#2a2a2a] rounded-lg hover:border-amber-600/50 hover:bg-[#0a0a0a] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <Wallet className="text-amber-400" size={24} />
                <div>
                  <h4 className="font-semibold text-white">Wise (TransferWise)</h4>
                  <p className="text-sm text-gray-400">Fast international transfers</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {methodType === "bank" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Country
                  </label>
                  <input
                    type="text"
                    name="bankCountry"
                    value={formData.bankCountry}
                    onChange={handleInputChange}
                    placeholder="e.g., Nigeria, Ghana, Kenya"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., First Bank, GTBank, Stanbic"
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none ${
                      validationErrors.bankName
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  />
                  {validationErrors.bankName && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.bankName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Code
                  </label>
                  <input
                    type="text"
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleInputChange}
                    placeholder="Optional - e.g., 011, 058"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Your full name as on bank account"
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none ${
                      validationErrors.accountHolderName
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  />
                  {validationErrors.accountHolderName && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.accountHolderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Your account number"
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none ${
                      validationErrors.accountNumber
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  />
                  {validationErrors.accountNumber && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Type *
                    {formData.bankCountry && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({isAfricanCountry(formData.bankCountry) ? 'African' : 'International'})
                      </span>
                    )}
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white focus:outline-none ${
                      validationErrors.accountType
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  >
                    <option value="">Select account type</option>
                    {getAccountTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.accountType && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.accountType}</p>
                  )}
                  {formData.bankCountry && (
                    <p className="text-gray-500 text-xs mt-1">
                      {isAfricanCountry(formData.bankCountry)
                        ? 'Showing African account types (Current, Savings, Fixed/Call Deposit)'
                        : 'Showing International account types (Checking, Savings, Business)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SWIFT Code / Sort Code
                  </label>
                  <input
                    type="text"
                    name="swiftCode"
                    value={formData.swiftCode}
                    onChange={handleInputChange}
                    placeholder="Optional - e.g., WEMAUSTL"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    placeholder="Optional - International Bank Account Number"
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            )}

            {methodType === "paypal" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PayPal Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your-email@paypal.com"
                  required
                  className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none ${
                    validationErrors.email
                      ? "border-red-500 focus:border-red-600"
                      : "border-[#2a2a2a] focus:border-purple-600"
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
            )}

            {methodType === "crypto" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Type *
                  </label>
                  <select
                    name="walletType"
                    value={formData.walletType}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white focus:outline-none ${
                      validationErrors.walletType
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  >
                    <option value="">Select wallet type</option>
                    <option value="Personal">Personal Wallet</option>
                    <option value="Exchange">Exchange Account</option>
                    <option value="Hardware">Hardware Wallet</option>
                    <option value="Other">Other</option>
                  </select>
                  {validationErrors.walletType && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.walletType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Network/Token *
                  </label>
                  <select
                    name="walletNetwork"
                    value={formData.walletNetwork}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white focus:outline-none ${
                      validationErrors.walletNetwork
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  >
                    <option value="">Select network</option>
                    <option value="USDC (SOL)">USDC (SOL)</option>
                  </select>
                  {validationErrors.walletNetwork && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.walletNetwork}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    placeholder="Your wallet address"
                    required
                    className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none font-mono text-sm ${
                      validationErrors.walletAddress
                        ? "border-red-500 focus:border-red-600"
                        : "border-[#2a2a2a] focus:border-purple-600"
                    }`}
                  />
                  {validationErrors.walletAddress && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.walletAddress}</p>
                  )}
                </div>
              </div>
            )}

            {methodType === "wise" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wise Email *
                </label>
                <input
                  type="email"
                  name="wiseEmail"
                  value={formData.wiseEmail}
                  onChange={handleInputChange}
                  placeholder="your-email@wise.com"
                  required
                  className={`w-full px-4 py-2 bg-[#0a0a0a] border rounded-lg text-white placeholder-gray-600 focus:outline-none ${
                    validationErrors.wiseEmail
                      ? "border-red-500 focus:border-red-600"
                      : "border-[#2a2a2a] focus:border-purple-600"
                  }`}
                />
                {validationErrors.wiseEmail && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.wiseEmail}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-6 border-t border-[#2a2a2a]">
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                }}
                variant="outline"
                className="flex-1 border-[#2a2a2a]"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Add Method
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}