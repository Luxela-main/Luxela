'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { trpc } from '@/app/_trpc/client';

interface ShippingRate {
  id: string;
  shippingZone: string;
  minWeight: number;
  maxWeight: number;
  rateCents: number;
  estimatedDays: number;
  shippingType: 'same_day' | 'next_day' | 'express' | 'standard' | 'domestic' | 'international' | 'both';
  currency?: string;
  active?: boolean;
}

const NIGERIAN_ZONES = [
  { id: 'north', label: 'Northern Region', states: ['Kano', 'Katsina', 'Sokoto', 'Kaduna'] },
  { id: 'south_west', label: 'South West', states: ['Lagos', 'Oyo', 'Ogun', 'Osun'] },
  { id: 'south_south', label: 'South South', states: ['Delta', 'Rivers', 'Akwa Ibom', 'Bayelsa'] },
  { id: 'south_east', label: 'South East', states: ['Abia', 'Anambra', 'Ebonyi', 'Enugu'] },
  { id: 'central', label: 'Central (FCT)', states: ['Abuja', 'Plateau', 'Nassarawa', 'Kogi'] },
  { id: 'north_east', label: 'North East', states: ['Borno', 'Yobe', 'Adamawa', 'Taraba'] },
];

export default function ShippingSettings() {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRate, setNewRate] = useState({
    shippingZone: '',
    minWeight: 0,
    maxWeight: 100,
    rateCents: 0,
    estimatedDays: 2,
    shippingType: 'standard' as const,
    active: true,
  });

  // TRPC mutations
  const getShippingRatesMutation = trpc.seller.getShippingRates.useQuery();
  const createShippingRateMutation = trpc.seller.createShippingRate.useMutation();
  const updateShippingRateMutation = trpc.seller.updateShippingRate.useMutation();
  const deleteShippingRateMutation = trpc.seller.deleteShippingRate.useMutation();

  // Load shipping rates
  useEffect(() => {
    if (getShippingRatesMutation.data) {
      setShippingRates(getShippingRatesMutation.data);
      setIsLoading(false);
    }
  }, [getShippingRatesMutation.data]);

  const handleAddRate = async () => {
    if (!newRate.shippingZone || newRate.rateCents < 0 || newRate.estimatedDays < 1) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      await createShippingRateMutation.mutateAsync({
        shippingZone: newRate.shippingZone,
        minWeight: newRate.minWeight,
        maxWeight: newRate.maxWeight,
        rateCents: newRate.rateCents,
        estimatedDays: newRate.estimatedDays,
        shippingType: newRate.shippingType,
        active: newRate.active,
      });

      toast.success('Shipping rate added successfully');
      setNewRate({ shippingZone: '', minWeight: 0, maxWeight: 100, rateCents: 0, estimatedDays: 2, shippingType: 'standard', active: true });
      setShowForm(false);
      getShippingRatesMutation.refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add shipping rate');
    }
  };

  const handleUpdateRate = async (id: string) => {
    const rate = shippingRates.find(r => r.id === id);
    if (!rate) return;

    try {
      await updateShippingRateMutation.mutateAsync({
        rateId: id,
        shippingZone: rate.shippingZone,
        minWeight: rate.minWeight,
        maxWeight: rate.maxWeight,
        rateCents: rate.rateCents,
        estimatedDays: rate.estimatedDays,
        active: rate.active ?? true,
      });

      toast.success('Shipping rate updated successfully');
      setEditingId(null);
      getShippingRatesMutation.refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update shipping rate');
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate?')) return;

    try {
      await deleteShippingRateMutation.mutateAsync({ rateId: id });
      toast.success('Shipping rate deleted successfully');
      getShippingRatesMutation.refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete shipping rate');
    }
  };

  const getZoneLabel = (zoneId: string) => {
    return NIGERIAN_ZONES.find(z => z.id === zoneId)?.label || zoneId;
  };

  const getShippingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'same_day': 'Same Day',
      'next_day': 'Next Day',
      'express': 'Express',
      'standard': 'Standard',
      'domestic': 'Domestic',
      'international': 'International',
      'both': 'Both'
    };
    return labels[type] || type;
  };

  const formatCurrency = (cents: number) => {
    return `₦${(cents / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatWeight = (weight: number) => {
    return `${weight}kg`;
  };

  const unusedZones = NIGERIAN_ZONES.filter(z => !shippingRates.some(r => r.shippingZone === z.id));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-white">Shipping Rates</h2>
        </div>
        <p className="text-gray-400 text-sm">
          Set shipping costs for different zones in Nigeria. Buyers will see these rates during checkout.
        </p>
      </div>

      {/* Current Shipping Rates */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
        {isLoading ? (
          <div className="text-gray-400 py-8 text-center">Loading shipping rates...</div>
        ) : shippingRates.length === 0 ? (
          <div className="text-gray-400 py-8 text-center">
            <p className="mb-4">No shipping rates configured yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add First Rate
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {shippingRates.map(rate => (
                <div key={rate.id} className="bg-[#242424] border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-lg">
                        {getZoneLabel(rate.shippingZone)}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Cost: {formatCurrency(rate.rateCents)} • Weight: {formatWeight(rate.minWeight)}-{formatWeight(rate.maxWeight)} • Type: {getShippingTypeLabel(rate.shippingType)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Estimated: {rate.estimatedDays} day(s) {rate.active ? '• Active' : '• Inactive'}
                      </p>
                    </div>

                    {editingId === rate.id ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateRate(rate.id)}
                          className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded transition-colors"
                          title="Save changes"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingId(rate.id)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                          title="Edit rate"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteRate(rate.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                          title="Delete rate"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit Mode */}
                  {editingId === rate.id && (
                    <div className="mt-4 pt-4 border-t border-[#333] space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Cost (₦)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={rate.rateCents / 100}
                            onChange={(e) => {
                              const updated = shippingRates.map(r =>
                                r.id === rate.id
                                  ? { ...r, rateCents: Math.round(parseFloat(e.target.value) * 100) }
                                  : r
                              );
                              setShippingRates(updated);
                            }}
                            className="w-full px-3 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estimated Days
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={rate.estimatedDays}
                            onChange={(e) => {
                              const updated = shippingRates.map(r =>
                                r.id === rate.id
                                  ? { ...r, estimatedDays: parseInt(e.target.value) }
                                  : r
                              );
                              setShippingRates(updated);
                            }}
                            className="w-full px-3 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Active
                          </label>
                          <input
                            type="checkbox"
                            checked={rate.active ?? true}
                            onChange={(e) => {
                              const updated = shippingRates.map(r =>
                                r.id === rate.id
                                  ? { ...r, active: e.target.checked }
                                  : r
                              );
                              setShippingRates(updated);
                            }}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Rate Button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#242424] hover:bg-[#333] border border-[#333] text-gray-300 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Add Another Zone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add New Shipping Rate Form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add Shipping Rate</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Zone</label>
              <select
                value={newRate.shippingZone}
                onChange={(e) => setNewRate({ ...newRate, shippingZone: e.target.value })}
                className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select a zone...</option>
                {unusedZones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.label}
                  </option>
                ))}
              </select>
              {newRate.shippingZone && (
                <p className="text-xs text-gray-400 mt-2">
                  States: {NIGERIAN_ZONES.find(z => z.id === newRate.shippingZone)?.states.join(', ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newRate.minWeight}
                  onChange={(e) =>
                    setNewRate({
                      ...newRate,
                      minWeight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={newRate.maxWeight}
                  onChange={(e) =>
                    setNewRate({
                      ...newRate,
                      maxWeight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Shipping Type</label>
                <select
                  value={newRate.shippingType}
                  onChange={(e) =>
                    setNewRate({
                      ...newRate,
                      shippingType: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="next_day">Next Day</option>
                  <option value="same_day">Same Day</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cost (₦)</label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="0.00"
                value={newRate.rateCents / 100}
                onChange={(e) =>
                  setNewRate({
                    ...newRate,
                    rateCents: Math.round(parseFloat(e.target.value) * 100),
                  })
                }
                className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={newRate.estimatedDays}
                onChange={(e) =>
                  setNewRate({ ...newRate, estimatedDays: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-[#242424] border border-[#333] rounded-lg text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 bg-[#333] hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRate}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Add Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Set competitive shipping rates to attract more buyers. Rates are calculated based on the buyer's delivery address zone.
        </p>
      </div>
    </div>
  );
}
