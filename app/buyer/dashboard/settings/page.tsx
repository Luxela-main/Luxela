'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock, Bell, Trash2, LogOut, Eye, EyeOff, Check, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('account');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');

  // tRPC mutations and queries
  const updateAccountMutation = trpc.buyer.updateAccountDetails.useMutation();
  const updatePasswordMutation = trpc.buyer.updatePassword.useMutation();
  const deleteAccountMutation = trpc.buyer.deleteAccount.useMutation();
  const updatePreferencesMutation = trpc.buyer.updateNotificationPreferences.useMutation();
  const { data: preferences } = trpc.buyer.getNotificationPreferences.useQuery();

  // Account form state
  const [accountData, setAccountData] = useState({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phoneNumber: profile?.phoneNumber || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  // Preferences form state
  const [preferencesData, setPreferencesData] = useState({
    orderUpdates: true,
    promotionalEmails: true,
    securityAlerts: true,
  });

  // Load preferences from database
  useEffect(() => {
    if (preferences) {
      setPreferencesData({
        orderUpdates: preferences.orderUpdates,
        promotionalEmails: preferences.promotionalEmails,
        securityAlerts: preferences.securityAlerts,
      });
    }
  }, [preferences]);

  // Check password requirements
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

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      checkPasswordRequirements(value);
    }
  };

  const handlePreferenceChange = (field: string, value: boolean) => {
    setPreferencesData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePreferencesMutation.mutateAsync({
        orderUpdates: preferencesData.orderUpdates,
        promotionalEmails: preferencesData.promotionalEmails,
        securityAlerts: preferencesData.securityAlerts,
      });

      alert('Notification preferences updated successfully');
    } catch (error: any) {
      alert(error?.message || 'Failed to update preferences');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call tRPC to update profile
      await updateAccountMutation.mutateAsync({
        fullName: accountData.fullName,
        phoneNumber: accountData.phoneNumber,
      });

      // Show success message
      alert('Profile updated successfully');
    } catch (error: any) {
      alert(error?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid()) {
      setPasswordError('Please ensure password meets all requirements');
      return;
    }

    setPasswordError('');

    try {
      // Call tRPC to update password
      await updatePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      alert('Password updated successfully. Please sign in again.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordDialog(false);

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error?.message || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      alert('Please enter your password to confirm deletion');
      return;
    }

    try {
      // Call tRPC to delete account
      await deleteAccountMutation.mutateAsync({ password: deleteAccountPassword });

      alert('Account deleted successfully');
      router.push('/signin');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    } finally {
      setDeleteAccountPassword('');
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-[#acacac] mt-2">Manage your account and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-b border-[#212121]">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="bg-[#1a1a1a] border-[#212121]">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-[#acacac]">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      name="fullName"
                      value={accountData.fullName}
                      onChange={handleAccountChange}
                      placeholder="John Doe"
                      className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={accountData.email}
                      disabled
                      className="bg-[#0e0e0e] border-[#212121] text-[#acacac]"
                    />
                    <p className="text-xs text-[#666] mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      name="phoneNumber"
                      value={accountData.phoneNumber}
                      onChange={handleAccountChange}
                      placeholder="+1 (555) 000-0000"
                      className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
                    />
                  </div>

                  <Button type="submit" disabled={updateAccountMutation.isPending} className="w-full">
                    {updateAccountMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            {/* Change Password */}
            <Card className="bg-[#1a1a1a] border-[#212121]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowPasswordDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="bg-[#1a1a1a] border-[#212121]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-[#acacac]">Permanently delete your account and data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="w-full"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="bg-[#1a1a1a] border-[#212121]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-[#acacac]">Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSave} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Order Updates
                    </label>
                    <input
                      type="checkbox"
                      checked={preferencesData.orderUpdates}
                      onChange={(e) => handlePreferenceChange('orderUpdates', e.target.checked)}
                      className="w-4 h-4 accent-[#8451E1] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Promotional Emails
                    </label>
                    <input
                      type="checkbox"
                      checked={preferencesData.promotionalEmails}
                      onChange={(e) => handlePreferenceChange('promotionalEmails', e.target.checked)}
                      className="w-4 h-4 accent-[#8451E1] cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">
                      Account Security Alerts
                    </label>
                    <input
                      type="checkbox"
                      checked={preferencesData.securityAlerts}
                      onChange={(e) => handlePreferenceChange('securityAlerts', e.target.checked)}
                      className="w-4 h-4 accent-[#8451E1] cursor-pointer"
                    />
                  </div>
                  <Button type="submit" disabled={updatePreferencesMutation.isPending} className="w-full mt-4">
                    {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="max-w-md bg-[#1a1a1a] border-[#212121]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Change Password</AlertDialogTitle>
          </AlertDialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-[#acacac]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#acacac]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-[#acacac]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#acacac]" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-[#0e0e0e] p-3 rounded-lg space-y-2 border border-[#212121]">
              <h4 className="text-sm font-medium text-white">Password requirements:</h4>
              <ul className="space-y-1 text-sm text-[#acacac]">
                <li className="flex items-center gap-2">
                  {passwordRequirements.minLength ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-[#666]" />
                  )}
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  {passwordRequirements.hasUppercase ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-[#666]" />
                  )}
                  One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  {passwordRequirements.hasLowercase ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-[#666]" />
                  )}
                  One lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  {passwordRequirements.hasNumber ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-[#666]" />
                  )}
                  One number
                </li>
                <li className="flex items-center gap-2">
                  {passwordRequirements.hasSpecialChar ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-[#666]" />
                  )}
                  One special character
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-[#acacac]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#acacac]" />
                  )}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-[#2a1a1a] border border-[#5a2a2a] rounded p-3">
                <p className="text-sm text-red-400">{passwordError}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <Button type="submit" disabled={!isPasswordValid() || updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#212121]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#acacac]">
              This action cannot be undone. All your data will be permanently deleted. Please enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter your password to confirm"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
              className="bg-[#0e0e0e] border-[#212121] text-white placeholder-[#666]"
            />
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending || !deleteAccountPassword}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}