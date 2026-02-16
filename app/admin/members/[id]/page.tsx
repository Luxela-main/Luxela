'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/hooks/useToast';
import Image from 'next/image';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toastHandler = useToast();
  const memberId = params.id as string;

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<'24_hours' | '7_days' | '30_days' | 'permanent'>('7_days');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const viewProfileMutation = trpc.adminMembers.viewProfile.useMutation();

  useEffect(() => {
    if (memberId) {
      viewProfileMutation.mutate({ memberId });
    }
  }, [memberId, viewProfileMutation]);

  const profileData = viewProfileMutation.data;
  const isLoading = viewProfileMutation.isPending;
  const error = viewProfileMutation.error;

  const suspendMutation = trpc.adminMembers.suspendAccount.useMutation({
    onSuccess: (data) => {
      toastHandler.success(data.message);
      setSuspendOpen(false);
      setSuspendReason('');
    },
    onError: (error) => {
      toastHandler.error(error.message || 'Failed to suspend account');
    },
  });

  const sendMessageMutation = trpc.adminMembers.sendMessage.useMutation({
    onSuccess: (data) => {
      toastHandler.success(data.message);
      setMessageOpen(false);
      setMessageSubject('');
      setMessageBody('');
    },
    onError: (error) => {
      toastHandler.error(error.message || 'Failed to send message');
    },
  });

  const verifyMutation = trpc.adminMembers.verifyAccount.useMutation({
    onSuccess: (data) => {
      toastHandler.success(data.message);
    },
    onError: (error) => {
      toastHandler.error(error.message || 'Failed to verify account');
    },
  });

  const profile = profileData?.profile;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1a1a1a] rounded w-32 mb-8"></div>
            <div className="h-32 bg-[#1a1a1a] rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-[#1a1a1a] rounded md:col-span-1"></div>
              <div className="h-64 bg-[#1a1a1a] rounded md:col-span-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            className="mb-6 border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="bg-[#0f0f0f] border-[#2B2B2B]">
            <CardContent className="pt-6">
              <p className="text-red-400">
                {error?.message || 'Failed to load member profile'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            className="border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Members
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a]"
              onClick={() => setMessageOpen(true)}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
              onClick={() => verifyMutation.mutate({ memberId })}
              disabled={verifyMutation.isPending}
            >
              <Shield className="w-4 h-4 mr-2" />
              Verify Account
            </Button>
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600/10"
              onClick={() => setSuspendOpen(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Suspend Account
            </Button>
          </div>
        </div>

        {/* Member Info */}
        <Card className="bg-[#0f0f0f] border-[#2B2B2B] mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {profile.profilePhoto ? (
                  <Image
                    src={profile.profilePhoto}
                    alt={profile.name || 'Profile'}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                    <div className="text-4xl text-[#6B7280]">
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl text-white">{profile.name}</CardTitle>
                  <CardDescription className="text-[#9CA3AF] mt-2">
                    <Badge
                      variant="outline"
                      className="capitalize border-[#2B2B2B] text-[#9CA3AF] mb-3"
                    >
                      {profile.role}
                    </Badge>
                  </CardDescription>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-[#9CA3AF]">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                    {profile.accountDetails?.phone && (
                      <div className="flex items-center gap-2 text-[#9CA3AF]">
                        <Phone className="w-4 h-4" />
                        {profile.accountDetails.phone}
                      </div>
                    )}
                    {profile.accountDetails?.country && (
                      <div className="flex items-center gap-2 text-[#9CA3AF]">
                        <MapPin className="w-4 h-4" />
                        {profile.accountDetails.state && `${profile.accountDetails.state}, `}
                        {profile.accountDetails.country}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#9CA3AF]">
                      <Calendar className="w-4 h-4" />
                      Joined {new Date(profile.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="bg-[#0f0f0f] border-[#2B2B2B]">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Account Status
                </p>
                <Badge className="bg-green-600 text-white">
                  {profile.status || 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Account Type
                </p>
                <p className="text-white capitalize">{profile.role}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Member Since
                </p>
                <p className="text-white">
                  {new Date(profile.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {profile.totalOrders !== undefined && (
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                    Total Orders
                  </p>
                  <p className="text-white text-lg font-semibold">{profile.totalOrders}</p>
                </div>
              )}
              {profile.totalListings !== undefined && (
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                    Active Listings
                  </p>
                  <p className="text-white text-lg font-semibold">{profile.totalListings}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Information (for sellers) */}
          {profile.role === 'seller' && profile.accountDetails && (
            <Card className="bg-[#0f0f0f] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle className="text-white">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.accountDetails.brandName && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Brand Name
                    </p>
                    <p className="text-white">{profile.accountDetails.brandName}</p>
                  </div>
                )}
                {profile.accountDetails.businessType && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Business Type
                    </p>
                    <p className="text-white capitalize">{profile.accountDetails.businessType}</p>
                  </div>
                )}
                {profile.accountDetails.phoneNumber && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Business Phone
                    </p>
                    <p className="text-white">{profile.accountDetails.phoneNumber}</p>
                  </div>
                )}
                {profile.accountDetails.country && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Business Location
                    </p>
                    <p className="text-white">
                      {profile.accountDetails.state && `${profile.accountDetails.state}, `}
                      {profile.accountDetails.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personal Information (for buyers) */}
          {profile.role === 'buyer' && profile.accountDetails && (
            <Card className="bg-[#0f0f0f] border-[#2B2B2B]">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.accountDetails.fullName && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Full Name
                    </p>
                    <p className="text-white">{profile.accountDetails.fullName}</p>
                  </div>
                )}
                {profile.accountDetails.phoneNumber && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Phone Number
                    </p>
                    <p className="text-white">{profile.accountDetails.phoneNumber}</p>
                  </div>
                )}
                {profile.accountDetails.country && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Location
                    </p>
                    <p className="text-white">
                      {profile.accountDetails.state && `${profile.accountDetails.state}, `}
                      {profile.accountDetails.country}
                    </p>
                  </div>
                )}
                {profile.accountDetails.email && (
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                      Email Address
                    </p>
                    <p className="text-white">{profile.accountDetails.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suspend Account Dialog */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent className="bg-[#0f0f0f] border-[#2B2B2B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Suspend Account</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9CA3AF]">
              Are you sure you want to suspend {profile?.name}'s account? This action can be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wide">
                Reason for Suspension (minimum 10 characters)
              </label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Explain the reason for suspending this account..."
                className="mt-2 bg-[#1a1a1a] border-[#2B2B2B] text-white placeholder-[#6B7280]"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wide">
                Duration
              </label>
              <Select value={suspendDuration} onValueChange={(val) => setSuspendDuration(val as any)}>
                <SelectTrigger className="mt-2 bg-[#1a1a1a] border-[#2B2B2B] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2B2B2B]">
                  <SelectItem value="24_hours" className="text-white">
                    24 Hours
                  </SelectItem>
                  <SelectItem value="7_days" className="text-white">
                    7 Days
                  </SelectItem>
                  <SelectItem value="30_days" className="text-white">
                    30 Days
                  </SelectItem>
                  <SelectItem value="permanent" className="text-white">
                    Permanent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-[#1a1a1a] border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#252525]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (suspendReason.length < 10) {
                  toastHandler.error('Please provide a reason (minimum 10 characters)');
                  return;
                }
                suspendMutation.mutate({
                  memberId,
                  reason: suspendReason,
                  duration: suspendDuration,
                });
              }}
              disabled={suspendMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="bg-[#0f0f0f] border-[#2B2B2B]">
          <DialogHeader>
            <DialogTitle className="text-white">Send Message to {profile?.name}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Send a message or notification to this member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wide">Subject</label>
              <Input
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="Message subject..."
                className="mt-2 bg-[#1a1a1a] border-[#2B2B2B] text-white placeholder-[#6B7280]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wide">Message</label>
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your message here..."
                className="mt-2 bg-[#1a1a1a] border-[#2B2B2B] text-white placeholder-[#6B7280]"
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              className="border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a]"
              onClick={() => setMessageOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!messageSubject.trim() || !messageBody.trim()) {
                  toastHandler.error('Please fill in all fields');
                  return;
                }
                sendMessageMutation.mutate({
                  memberId,
                  subject: messageSubject,
                  message: messageBody,
                });
              }}
              disabled={sendMessageMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}