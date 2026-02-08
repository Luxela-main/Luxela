'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveTable } from '@/components/admin/ResponsiveTable';
import {
  Users,
  UserCheck,
  TrendingUp,
  MoreHorizontal,
  Loader2,
  Search,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller';
  status: string;
  joinDate: Date;
  profilePhoto?: string | null;
}

export default function AdminMembersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal states
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [suspendAccountOpen, setSuspendAccountOpen] = useState(false);
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);
  const [inviteAdminOpen, setInviteAdminOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<
    '24_hours' | '7_days' | '30_days' | 'permanent'
  >('7_days');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');

  // TRPC mutations
  const viewProfileMutation = trpc.adminMembers.viewProfile.useMutation({
    onSuccess: (data) => {
      if (data.success && data.profile) {
        setSelectedMember({
          id: data.profile.id,
          name: data.profile.name ?? 'Unknown',
          email: data.profile.email ?? 'Unknown',
          role: data.profile.role,
          status: data.profile.status,
          joinDate: new Date(data.profile.joinDate),
          profilePhoto: data.profile.profilePhoto,
        });
        setViewProfileOpen(true);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to load member profile');
    },
  });

  const sendMessageMutation = trpc.adminMembers.sendMessage.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Message sent successfully');
        setSendMessageOpen(false);
        setMessageSubject('');
        setMessageContent('');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const verifyAccountMutation = trpc.adminMembers.verifyAccount.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setVerifyConfirmOpen(false);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify account');
    },
  });

  const suspendAccountMutation = trpc.adminMembers.suspendAccount.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setSuspendAccountOpen(false);
        setSuspendReason('');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to suspend account');
    },
  });

  const inviteAdminMutation = trpc.adminMembers.inviteAdmin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setInviteAdminOpen(false);
        setInviteEmail('');
        setInviteFullName('');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to invite admin member');
    },
  });

  // Fetch real members data
  const { data: membersData, isLoading: membersLoading } =
    trpc.adminMembers.getAllMembers.useQuery({
      page: currentPage,
      limit: 20,
      search: searchTerm,
      role: roleFilter as 'buyer' | 'seller' | 'all',
    });

  const { data: statsData, isLoading: statsLoading } =
    trpc.adminMembers.getMembersStats.useQuery();

  const members = membersData?.members || [];
  const stats = {
    totalMembers: statsData?.totalMembers || 0,
    activeBuyers: statsData?.activeBuyers || 0,
    activeSellers: statsData?.activeSellers || 0,
    newThisMonth: statsData?.newThisMonth || 0,
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'buyer':
        return 'bg-green-100 text-green-900 border-green-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  const isLoading = membersLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#8451e1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Members Management
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3AF]">
              View and manage all platform members including buyers and sellers
            </p>
          </div>
          <Button
            onClick={() => setInviteAdminOpen(true)}
            className="bg-[#8451e1] hover:bg-[#6d3fb5] gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite Admin</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#9CA3AF] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8451e1]" />
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats.totalMembers}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">All roles</p>
          </CardContent>
        </Card>

        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Active Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {stats.activeBuyers}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Purchasing members</p>
          </CardContent>
        </Card>

        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Active Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-400">
              {stats.activeSellers}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Selling members</p>
          </CardContent>
        </Card>

        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-[#9CA3AF] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#8451e1]" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {stats.newThisMonth}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">Recent sign-ups</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">Members List</CardTitle>
              <CardDescription className="text-[#9CA3AF]">
                Showing {members.length} of {stats.totalMembers} members
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search members..."
                  className="pl-10 bg-[#0e0e0e] border-[#2B2B2B] text-white text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(v) => {
                  setRoleFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40 bg-[#0e0e0e] border-[#2B2B2B] text-white text-sm">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2B2B2B]">
                  <SelectItem value="all" className="text-white">
                    All Roles
                  </SelectItem>
                  <SelectItem value="buyer" className="text-white">
                    Buyers
                  </SelectItem>
                  <SelectItem value="seller" className="text-white">
                    Sellers
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <ResponsiveTable
              columns={[
                {
                  key: 'name',
                  label: 'Name',
                  mobileLabel: 'Member',
                },
                {
                  key: 'email',
                  label: 'Email',
                  mobileLabel: 'Email',
                },
                {
                  key: 'role',
                  label: 'Role',
                  mobileLabel: 'Role',
                  render: (value: string) => (
                    <Badge className={getRoleColor(value)}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  mobileLabel: 'Status',
                  render: (value: string) => (
                    <Badge className="bg-green-500/20 text-green-400">
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Badge>
                  ),
                },
                {
                  key: 'joinDate',
                  label: 'Join Date',
                  mobileLabel: 'Joined',
                  render: (value: any) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  },
                },
              ]}
              data={members}
              actions={(member) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-[#1a1a1a]"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a1a] border-[#2B2B2B]"
                  >
                    <DropdownMenuItem
                      className="text-[#9CA3AF] cursor-pointer hover:bg-[#0e0e0e]"
                      onClick={() => {
                        setSelectedMember(member);
                        viewProfileMutation.mutate({ memberId: member.id });
                      }}
                    >
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-[#9CA3AF] cursor-pointer hover:bg-[#0e0e0e]"
                      onClick={() => {
                        setSelectedMember(member);
                        setSendMessageOpen(true);
                      }}
                    >
                      Send Message
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-yellow-600 cursor-pointer hover:bg-[#0e0e0e]"
                      onClick={() => {
                        setSelectedMember(member);
                        setVerifyConfirmOpen(true);
                      }}
                    >
                      Verify Account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer hover:bg-[#0e0e0e]"
                      onClick={() => {
                        setSelectedMember(member);
                        setSuspendAccountOpen(true);
                      }}
                    >
                      Suspend Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          ) : (
            <div className="text-center py-12 text-[#9CA3AF]">
              <p>No members found matching your criteria</p>
            </div>
          )}

          {/* Pagination */}
          {membersData && membersData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#2B2B2B]">
              <div className="text-sm text-[#9CA3AF]">
                Page {currentPage} of {membersData.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[#2B2B2B] hover:bg-[#8451e1] text-[#9CA3AF]"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="border-[#2B2B2B] hover:bg-[#8451e1] text-[#9CA3AF]"
                  disabled={currentPage === membersData.totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Profile Dialog */}
      <Dialog open={viewProfileOpen} onOpenChange={setViewProfileOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2B2B2B] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Detailed information about the member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#0e0e0e] p-4 space-y-3">
                <div>
                  <p className="text-xs text-[#6B7280]">Name</p>
                  <p className="text-sm font-medium">{selectedMember.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Email</p>
                  <p className="text-sm font-medium">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Role</p>
                  <Badge className={getRoleColor(selectedMember.role)}>
                    {selectedMember.role.charAt(0).toUpperCase() +
                      selectedMember.role.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Join Date</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedMember.joinDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2B2B2B] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to Member</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280]">Subject</label>
              <Input
                placeholder="Message subject"
                className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Message</label>
              <Textarea
                placeholder="Type your message here..."
                className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1 min-h-32"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (
                  selectedMember &&
                  messageSubject.trim() &&
                  messageContent.trim()
                ) {
                  sendMessageMutation.mutate({
                    memberId: selectedMember.id,
                    subject: messageSubject,
                    message: messageContent,
                  });
                } else {
                  toast.error('Please fill in all fields');
                }
              }}
              disabled={sendMessageMutation.isPending}
              className="w-full bg-[#8451e1] hover:bg-[#6d3fb5]"
            >
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Account Confirmation */}
      <AlertDialog open={verifyConfirmOpen} onOpenChange={setVerifyConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] border-[#2B2B2B]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Verify Member Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#9CA3AF]">
              This will verify {selectedMember?.name} account and grant them
              access to additional features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2B2B2B] text-[#9CA3AF] hover:text-white hover:bg-[#0e0e0e]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMember) {
                  verifyAccountMutation.mutate({
                    memberId: selectedMember.id,
                  });
                }
              }}
              disabled={verifyAccountMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {verifyAccountMutation.isPending ? 'Verifying...' : 'Verify'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Account Dialog */}
      <Dialog open={suspendAccountOpen} onOpenChange={setSuspendAccountOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2B2B2B] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Suspend Account</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280]">Duration</label>
              <Select
                value={suspendDuration}
                onValueChange={(val) =>
                  setSuspendDuration(
                    val as
                      | '24_hours'
                      | '7_days'
                      | '30_days'
                      | 'permanent'
                  )
                }
              >
                <SelectTrigger className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1">
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
            <div>
              <label className="text-xs text-[#6B7280]">Reason</label>
              <Textarea
                placeholder="Why are you suspending this account?"
                className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1 min-h-24"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                if (selectedMember && suspendReason.trim()) {
                  suspendAccountMutation.mutate({
                    memberId: selectedMember.id,
                    reason: suspendReason,
                    duration: suspendDuration,
                  });
                } else {
                  toast.error('Please provide a suspension reason');
                }
              }}
              disabled={suspendAccountMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {suspendAccountMutation.isPending ? 'Suspending...' : 'Suspend'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Admin Dialog */}
      <Dialog open={inviteAdminOpen} onOpenChange={setInviteAdminOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2B2B2B] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New Admin Member</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Send an invitation to join the admin team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6B7280]">Full Name</label>
              <Input
                placeholder="Enter full name"
                className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-[#6B7280]">Email Address</label>
              <Input
                placeholder="Enter email address"
                type="email"
                className="bg-[#0e0e0e] border-[#2B2B2B] text-white mt-1"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-[#6B7280]">
              An invitation email will be sent to this address with instructions to join as an admin member.
            </p>
            <Button
              onClick={() => {
                if (inviteEmail.trim() && inviteFullName.trim()) {
                  inviteAdminMutation.mutate({
                    email: inviteEmail,
                    fullName: inviteFullName,
                    role: 'admin',
                  });
                } else {
                  toast.error('Please fill in all fields');
                }
              }}
              disabled={inviteAdminMutation.isPending}
              className="w-full bg-[#8451e1] hover:bg-[#6d3fb5]"
            >
              {inviteAdminMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}