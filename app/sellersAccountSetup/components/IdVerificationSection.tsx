'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';
import { PHONE_COUNTRY_CODES, ID_TYPES } from '../constants/formOptions';

interface IdVerificationSectionProps {
  idType: string;
  idNumber: string;
  onIdTypeChange: (value: string) => void;
  onIdNumberChange: (value: string) => void;
  onVerificationComplete: (verified: boolean) => void;
  country: string;
}

interface VerifiedData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
}

const COUNTRY_MAP: Record<string, string> = {
  NG: 'Nigeria',
  KE: 'Kenya',
  GH: 'Ghana',
  ZA: 'South Africa',
  UG: 'Uganda',
  TZ: 'Tanzania',
};

export const IdVerificationSection: React.FC<IdVerificationSectionProps> = ({
  idType,
  idNumber,
  onIdTypeChange,
  onIdNumberChange,
  onVerificationComplete,
  country,
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedData, setVerifiedData] = useState<VerifiedData | null>(null);
  const [showVerifiedData, setShowVerifiedData] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const verifyMutation = trpc.seller.verifyId.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setIsVerified(true);
        setVerificationError(null);

        // Extract verified personal info from the API response
        if (data.personalInfo) {
          setVerifiedData({
            firstName: data.personalInfo.firstName || undefined,
            lastName: data.personalInfo.lastName || undefined,
            dateOfBirth: data.personalInfo.dateOfBirth || undefined,
            phone: data.personalInfo.phone || undefined,
            email: data.personalInfo.email || undefined,
            address: data.personalInfo.address || undefined,
          });
        }

        toastSvc.success('✅ ID Verified Successfully');
        onVerificationComplete(true);
      } else {
        const errorMsg = data.message || 'Verification failed';
        setVerificationError(errorMsg);
        toastSvc.error(`❌ ${errorMsg}`);
      }
    },
    onError: (err: any) => {
      const errorMsg = err?.message || err?.data?.message || 'Failed to verify ID';
      setVerificationError(errorMsg);
      toastSvc.error(`❌ ${errorMsg}`);
    },
  });

  const handleVerifyId = () => {
    if (!idType || !idNumber) {
      toastSvc.error('Please select ID type and enter ID number');
      return;
    }

    if (idNumber.trim().length < 5) {
      toastSvc.error('ID number is too short');
      return;
    }

    setVerificationError(null);
    verifyMutation.mutate({
      idType: idType as any,
      idNumber: idNumber.trim(),
      country: country || 'NG',
    });
  };

  const handleReset = () => {
    setIsVerified(false);
    setVerifiedData(null);
    setShowVerifiedData(false);
    setVerificationError(null);
    onIdNumberChange('');
    onIdTypeChange('');
    onVerificationComplete(false);
  };

  const getCountryLabel = (code: string): string => {
    return COUNTRY_MAP[code] || PHONE_COUNTRY_CODES.find(c => c.value === code)?.label || code;
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded border border-[#747474] bg-[#1e1e1e] text-[#f2f2f2] placeholder:text-[#858585] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors';

  const selectClass = inputClass;

  return (
    <div className="border-t border-[#747474] pt-6 mt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#f2f2f2] flex items-center gap-2">
            <span>🆔 ID Verification</span>
          </h3>
          <p className="text-xs text-[#858585] mt-1">
            Verify your identity to unlock seller features and build trust
          </p>
        </div>
      </div>

      {/* Status Badge */}
      {isVerified && (
        <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500/30 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-400">
            ✅ Your identity is verified • Verified on {new Date().toLocaleDateString()}
          </span>
        </div>
      )}

      {verificationError && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Verification Failed</p>
              <p className="text-xs text-red-400/80 mt-1">{verificationError}</p>
              {verificationError.includes('API') && (
                <p className="text-xs text-red-400/70 mt-2">
                  💡 Tip: Check your Dojah API credentials or contact support
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Section */}
      {!isVerified ? (
        <div className="space-y-5">
          {/* Country Selection */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2 text-[#dcdcdc] font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Verification Country
              </span>
              <span className="text-xs text-purple-400">Required</span>
            </label>
            <div className="p-3 rounded border border-[#747474] bg-[#1e1e1e] text-[#f2f2f2]">
              <div className="flex items-center justify-between">
                <span className="text-sm">{getCountryLabel(country)}</span>
                <span className="text-xs text-[#858585]">
                  {country === 'NG'
                    ? '🇳🇬 Nigeria'
                    : country === 'KE'
                      ? '🇰🇪 Kenya'
                      : country === 'GH'
                        ? '🇬🇭 Ghana'
                        : country === 'ZA'
                          ? '🇿🇦 South Africa'
                          : country === 'UG'
                            ? '🇺🇬 Uganda'
                            : country === 'TZ'
                              ? '🇹🇿 Tanzania'
                              : 'Unknown'}
                </span>
              </div>
            </div>
            <p className="text-xs text-[#858585] mt-1.5">
              ℹ️ Identity verification is available in Nigeria, Kenya, Ghana, South Africa, Uganda, and Tanzania
            </p>
          </div>

          {/* ID Type Selection */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2 text-[#dcdcdc] font-medium">
              <span>ID Type</span>
              <span className="text-xs text-purple-400">Required</span>
            </label>
            <select
              value={idType}
              onChange={(e) => onIdTypeChange(e.target.value)}
              className={selectClass}
            >
              <option value="">Select ID type</option>
              {ID_TYPES.filter((id) =>
                ['passport', 'drivers_license', 'voters_card', 'national_id'].includes(id.value)
              ).map((idTypeOption) => (
                <option key={idTypeOption.value} value={idTypeOption.value}>
                  {idTypeOption.label}
                </option>
              ))}
            </select>
            {idType && (
              <p className="text-xs text-[#858585] mt-1.5 flex items-start gap-1.5">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                {ID_TYPES.find((id) => id.value === idType)?.description}
              </p>
            )}
          </div>

          {/* ID Number Input */}
          <div>
            <label className="flex items-center justify-between text-sm mb-2 text-[#dcdcdc] font-medium">
              <span>ID Number</span>
              <span className="text-xs text-purple-400">Required</span>
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => onIdNumberChange(e.target.value.toUpperCase())}
              placeholder={
                idType === 'national_id'
                  ? 'e.g., 12345678910'
                  : idType === 'drivers_license'
                    ? 'e.g., DL-123-456-789'
                    : idType === 'passport'
                      ? 'e.g., A12345678'
                      : 'Enter ID number'
              }
              className={selectClass}
            />
            <p className="text-xs text-[#858585] mt-1.5">
              {idNumber.length > 0
                ? `${idNumber.length} characters entered`
                : 'Enter your ID number exactly as it appears on your document'}
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 rounded bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-400/90">
                <p className="font-medium mb-1">Why we need this:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Verify seller legitimacy and prevent fraud</li>
                  <li>Comply with regulatory requirements</li>
                  <li>Build buyer trust and confidence</li>
                  <li>Enable advanced marketplace features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyId}
            disabled={!idNumber || !idType || verifyMutation.isPending}
            className={`w-full px-4 py-2.5 rounded font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              verifyMutation.isPending
                ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying your ID...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Verify Identity
              </>
            )}
          </button>
        </div>
      ) : (
        // Verified State
        <div className="space-y-5">
          {/* Verified Data Display */}
          {verifiedData && (
            <>
              <div className="p-4 rounded bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verified Personal Information
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowVerifiedData(!showVerifiedData)}
                    className="p-1.5 hover:bg-green-500/10 rounded transition-colors"
                  >
                    {showVerifiedData ? (
                      <EyeOff className="w-4 h-4 text-green-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                </div>

                {showVerifiedData && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {verifiedData?.firstName && (
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">First Name</p>
                        <p className="text-green-400 font-medium">{verifiedData.firstName}</p>
                      </div>
                    )}
                    {verifiedData?.lastName && (
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">Last Name</p>
                        <p className="text-green-400 font-medium">{verifiedData.lastName}</p>
                      </div>
                    )}
                    {verifiedData?.dateOfBirth && (
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">Date of Birth</p>
                        <p className="text-green-400 font-medium">
                          {new Date(verifiedData.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {verifiedData?.phone && (
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">Phone</p>
                        <p className="text-green-400 font-medium">{verifiedData.phone}</p>
                      </div>
                    )}
                    {verifiedData?.email && (
                      <div>
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">Email</p>
                        <p className="text-green-400 font-medium">{verifiedData.email}</p>
                      </div>
                    )}
                    {verifiedData?.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-green-400/70 uppercase tracking-wide">Address</p>
                        <p className="text-green-400 font-medium">{verifiedData.address}</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-green-400/70 mt-3">
                  ✓ Your identity has been verified with Dojah KYC service
                </p>
              </div>
            </>
          )}

          {/* Verified Summary */}
          <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-purple-400">
              <span className="font-semibold">ID Type:</span> {ID_TYPES.find((t) => t.value === idType)?.label}
              {' • '}
              <span className="font-semibold">Country:</span> {getCountryLabel(country)}
            </p>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-2.5 rounded font-medium transition-all duration-200 border border-[#747474] hover:border-purple-500 text-[#dcdcdc] hover:text-white hover:bg-purple-500/10"
          >
            Change ID Information
          </button>
        </div>
      )}
    </div>
  );
};