'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/hooks/useToast';
import {
  Plus,
  Trash2,
  Edit,
  Users,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  currentLoadCount: number;
  maxCapacity: number;
  responseTimeAverage: number | null;
}

interface SLAPolicy {
  id: string;
  policyName: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
}

export default function SupportTeamPage() {
  const toast = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [slaPolicies, setSLAPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'team' | 'sla'>('team');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddSLA, setShowAddSLA] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'support_agent',
    maxCapacity: 10,
  });
  const [newSLA, setNewSLA] = useState({
    policyName: '',
    priority: 'medium',
    responseTimeMinutes: 60,
    resolutionTimeMinutes: 480,
  });

  // Fetch team members
  const teamQuery = trpc.supportAdmin.getTeamMembers.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Fetch SLA policies
  const slaQuery = trpc.supportAdmin.getSLAPolicies.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Add team member mutation
  const addMemberMutation = trpc.supportAdmin.addTeamMember.useMutation({
    onSuccess: () => {
      toast.success('Team member added successfully');
      setShowAddMember(false);
      setNewMember({ name: '', email: '', role: 'support_agent', maxCapacity: 10 });
      teamQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to add team member');
    },
  });

  // Add SLA policy mutation
  const addSLAMutation = trpc.supportAdmin.setSLAPolicy.useMutation({
    onSuccess: () => {
      toast.success('SLA policy created successfully');
      setShowAddSLA(false);
      setNewSLA({
        policyName: '',
        priority: 'medium',
        responseTimeMinutes: 60,
        resolutionTimeMinutes: 480,
      });
      slaQuery.refetch();
    },
    onError: () => {
      toast.error('Failed to create SLA policy');
    },
  });

  // Load data
  useEffect(() => {
    if (teamQuery.data && slaQuery.data) {
      setTeamMembers(teamQuery.data);
      setSLAPolicies(slaQuery.data);
      setLoading(false);
    }
  }, [teamQuery.data, slaQuery.data]);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        userId: Math.random().toString(), // In production, use actual user ID
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        maxCapacity: newMember.maxCapacity,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleAddSLA = async () => {
    if (!newSLA.policyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addSLAMutation.mutateAsync({
        policyName: newSLA.policyName,
        priority: newSLA.priority as any,
        responseTimeMinutes: newSLA.responseTimeMinutes,
        resolutionTimeMinutes: newSLA.resolutionTimeMinutes,
      });
    } catch (error) {
      // Error is handled by mutation
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8451E1]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b border-[#2B2B2B] p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Support Team Management</h1>
          <p className="text-[#DCDCDC]">Manage team members and SLA policies</p>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#2B2B2B]">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'team'
                ? 'border-b-2 border-[#8451E1] text-white'
                : 'text-[#808080] hover:text-white'
            }`}
          >
            <Users size={20} />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'sla'
                ? 'border-b-2 border-[#8451E1] text-white'
                : 'text-[#808080] hover:text-white'
            }`}
          >
            <Zap size={20} />
            SLA Policies
          </button>
        </div>

        {/* Team Members Tab */}
        {activeTab === 'team' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Team Members</h2>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-2 px-4 py-2 bg-[#8451E1] hover:bg-[#7040d1] rounded text-white font-medium transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newMember.name}
                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                    className="px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
                  />
                  <select
                    value={newMember.role}
                    onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                    className="px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="support_agent">Support Agent</option>
                    <option value="support_supervisor">Supervisor</option>
                    <option value="support_manager">Manager</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Max Capacity"
                    value={newMember.maxCapacity}
                    onChange={e => setNewMember({ ...newMember, maxCapacity: parseInt(e.target.value) })}
                    className="px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMember}
                    disabled={addMemberMutation.isPending}
                    className="flex-1 px-4 py-2 bg-[#8451E1] hover:bg-[#7040d1] disabled:opacity-50 rounded text-white font-medium transition-colors cursor-pointer"
                  >
                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 px-4 py-2 bg-[#2B2B2B] hover:bg-[#3B3B3B] rounded text-white font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Team Members List */}
            <div className="space-y-4">
              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-[#808080] mx-auto mb-4" />
                  <p className="text-[#808080]">No team members yet</p>
                </div>
              ) : (
                teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-[#8451E1] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                        <p className="text-sm text-[#808080] mb-3">{member.email}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Role</p>
                            <p className="font-medium">{member.role.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Capacity</p>
                            <p className="font-medium">
                              {member.currentLoadCount} / {member.maxCapacity}
                            </p>
                            <div className="w-full bg-[#0E0E0E] rounded-full h-2 mt-1">
                              <div
                                className="bg-[#8451E1] h-2 rounded-full"
                                style={{
                                  width: `${(member.currentLoadCount / member.maxCapacity) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-[#808080] text-xs mb-1">Status</p>
                            <span className="inline-block px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded font-medium">
                              {member.status}
                            </span>
                          </div>
                        </div>
                        {member.responseTimeAverage && (
                          <p className="text-xs text-[#808080] mt-3">
                            Avg Response Time: {member.responseTimeAverage} min
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="p-2 hover:bg-[#0E0E0E] rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded transition-colors text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SLA Policies Tab */}
        {activeTab === 'sla' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">SLA Policies</h2>
              <button
                onClick={() => setShowAddSLA(!showAddSLA)}
                className="flex items-center gap-2 px-4 py-2 bg-[#8451E1] hover:bg-[#7040d1] rounded text-white font-medium transition-colors cursor-pointer"
              >
                <Plus size={16} />
                Add Policy
              </button>
            </div>

            {/* Add SLA Form */}
            {showAddSLA && (
              <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Policy Name"
                    value={newSLA.policyName}
                    onChange={e => setNewSLA({ ...newSLA, policyName: e.target.value })}
                    className="col-span-2 px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1]"
                  />
                  <select
                    value={newSLA.priority}
                    onChange={e => setNewSLA({ ...newSLA, priority: e.target.value })}
                    className="px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-[#8451E1] cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <div />
                  <div>
                    <label className="text-xs text-[#808080] mb-2 block">Response Time (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={newSLA.responseTimeMinutes}
                      onChange={e => setNewSLA({ ...newSLA, responseTimeMinutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-[#8451E1]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#808080] mb-2 block">Resolution Time (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={newSLA.resolutionTimeMinutes}
                      onChange={e => setNewSLA({ ...newSLA, resolutionTimeMinutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-[#0E0E0E] border border-[#2B2B2B] rounded text-white focus:outline-none focus:border-[#8451E1]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSLA}
                    disabled={addSLAMutation.isPending}
                    className="flex-1 px-4 py-2 bg-[#8451E1] hover:bg-[#7040d1] disabled:opacity-50 rounded text-white font-medium transition-colors cursor-pointer"
                  >
                    {addSLAMutation.isPending ? 'Creating...' : 'Create Policy'}
                  </button>
                  <button
                    onClick={() => setShowAddSLA(false)}
                    className="flex-1 px-4 py-2 bg-[#2B2B2B] hover:bg-[#3B3B3B] rounded text-white font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SLA Policies List */}
            <div className="space-y-4">
              {slaPolicies.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-[#808080] mx-auto mb-4" />
                  <p className="text-[#808080]">No SLA policies yet</p>
                </div>
              ) : (
                slaPolicies.map(policy => (
                  <div
                    key={policy.id}
                    className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-[#8451E1] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold mb-1">{policy.policyName}</h3>
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold rounded ${
                            policy.priority === 'critical'
                              ? 'bg-red-500/10 text-red-400'
                              : policy.priority === 'high'
                              ? 'bg-orange-500/10 text-orange-400'
                              : policy.priority === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {policy.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-[#0E0E0E] rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded transition-colors text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#808080] text-xs mb-1">Response Time</p>
                        <p className="font-medium">{policy.responseTimeMinutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-[#808080] text-xs mb-1">Resolution Time</p>
                        <p className="font-medium">{policy.resolutionTimeMinutes} minutes</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}