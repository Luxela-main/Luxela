'use client';

import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Trash2, Eye, EyeOff, Check, X, Truck, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/context/AuthContext';
import ShippingSettings from './components/ShippingSettings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const dynamic = 'force-dynamic';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

type SettingTab = 'security' | 'shipping' | 'help';

export default function SellerSettings() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingTab>('security');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentDateTime(`${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`);
  }, []);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const updatePasswordMutation = trpc.seller.updatePassword.useMutation();
  const deleteAccountMutation = trpc.seller.deleteAccount.useMutation();

  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  };

  const isPasswordValid = () => {
    return (
      passwordRequirements.minLength &&
      passwordRequirements.hasUppercase &&
      passwordRequirements.hasLowercase &&
      passwordRequirements.hasNumber &&
      passwordRequirements.hasSpecialChar &&
      passwordData.newPassword === passwordData.confirmPassword &&
      passwordData.currentPassword.length > 0
    );
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      checkPasswordRequirements(value);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!isPasswordValid()) {
      setPasswordError('Password does not meet all requirements');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess('Password updated successfully. Please sign in again.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordDialog(false);

      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error?.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Please enter your password to delete account');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await deleteAccountMutation.mutateAsync({ password: deletePassword });
      alert('Account deleted successfully');
      router.push('/signin');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setIsSubmittingPassword(false);
      setDeletePassword('');
    }
  };

  const handleLogout = async () => {
    try {
      setShowLogoutDialog(false);
      await logout();
      router.push('/signin');
    } catch (error: any) {
      console.error('Logout failed:', error);
      setShowLogoutDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account, shipping, and more</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-[#333]">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'security'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Lock size={18} />
            Security
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'shipping'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Truck size={18} />
            Shipping
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'help'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <HelpCircle size={18} />
            Help
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-white">Change Password</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Update your password to keep your account secure
              </p>
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
              >
                Change Password
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Active Sessions</h2>
              <div className="bg-[#242424] p-4 rounded-lg border border-[#333]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">Current Session</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {currentDateTime || 'Loading...'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full border border-green-700/30">
                    Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-full mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-md text-sm transition-colors flex items-center justify-center gap-2 border border-red-700/30 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-red-300">Danger Zone</h2>
              </div>
              <p className="text-sm text-red-300/80 mb-4">
                Permanently delete your account and all associated data
              </p>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <ShippingSettings />
        )}

        {/* Help Tab */}
        {activeTab === 'help' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Help & Support</h2>
              <div className="space-y-4 text-gray-400">
                <div>
                  <h3 className="text-white font-medium mb-2">Need Assistance?</h3>
                  <p>Contact our support team at support@theluxela.com or visit our help center.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="max-w-md bg-[#1a1a1a] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Change Password</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Enter your current password and choose a new secure password
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-[#333] bg-[#242424] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(prev => ({ ...prev, current: !prev.current }))
                  }
                  className="absolute right-3 top-3"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-[#333] bg-[#242424] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-3"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-400">Password must contain:</p>
                <div className="space-y-1">
                  <RequirementItem
                    met={passwordRequirements.minLength}
                    text="At least 8 characters"
                  />
                  <RequirementItem
                    met={passwordRequirements.hasUppercase}
                    text="One uppercase letter (A-Z)"
                  />
                  <RequirementItem
                    met={passwordRequirements.hasLowercase}
                    text="One lowercase letter (a-z)"
                  />
                  <RequirementItem met={passwordRequirements.hasNumber} text="One number (0-9)" />
                  <RequirementItem
                    met={passwordRequirements.hasSpecialChar}
                    text="One special character (!@#$%^&*)"
                  />
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-[#333] bg-[#242424] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))
                  }
                  className="absolute right-3 top-3"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              {passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
            </div>

            {/* Error/Success Messages */}
            {passwordError && (
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded text-sm text-red-400">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-900/20 border border-green-700/30 rounded text-sm text-green-400">
                {passwordSuccess}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <AlertDialogCancel disabled={isSubmittingPassword} className="bg-[#242424] border-[#333] text-gray-200 hover:bg-[#333]">Cancel</AlertDialogCancel>
              <button
                type="submit"
                disabled={!isPasswordValid() || isSubmittingPassword}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={false} className="bg-[#242424] border-[#333] text-gray-200 hover:bg-[#333]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Log Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#333]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. All your data, orders, and account information will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-700/30">
              <p className="text-sm font-medium text-red-300">
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Enter your password to confirm deletion:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-[#333] bg-[#242424] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={isSubmittingPassword} className="bg-[#242424] border-[#333] text-gray-200 hover:bg-[#333]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isSubmittingPassword || !deletePassword}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmittingPassword ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <X className="w-4 h-4 text-gray-600" />
      )}
      <span className={`text-xs ${met ? 'text-green-400' : 'text-gray-500'}`}>{text}</span>
    </div>
  );
}