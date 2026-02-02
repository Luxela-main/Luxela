'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  listing: any;
  onClose: () => void;
  onUpdate: (newQuantity: number) => void;
  isLoading?: boolean;
}

const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  listing,
  onClose,
  onUpdate,
  isLoading = false,
}) => {
  const [newQuantity, setNewQuantity] = useState(listing?.quantity || 0);
  const [mode, setMode] = useState<'set' | 'add'>('set');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentQuantity = listing?.quantity || 0;
  const quantityDifference = newQuantity - currentQuantity;
  const quantityChange = mode === 'add' ? quantityDifference : newQuantity - currentQuantity;

  const getStockLevel = (qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
    if (qty <= 10) return { label: 'Critical', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' };
    if (qty <= 50) return { label: 'Low Stock', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' };
    if (qty <= 200) return { label: 'Optimal', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
    return { label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' };
  };

  const currentLevel = getStockLevel(currentQuantity);
  const newLevel = getStockLevel(newQuantity);

  const handleIncrement = () => {
    const newVal = mode === 'set' ? newQuantity + 1 : newQuantity + 1;
    if (newVal <= 9999) {
      setNewQuantity(newVal);
      setError('');
    }
  };

  const handleDecrement = () => {
    const newVal = mode === 'set' ? Math.max(0, newQuantity - 1) : newQuantity - 1;
    if (newVal >= 0) {
      setNewQuantity(newVal);
      setError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setNewQuantity(0);
      setError('');
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return;
    }

    if (num < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    if (num > 9999) {
      setError('Maximum quantity is 9999');
      return;
    }

    setNewQuantity(num);
    setError('');
  };

  const handleUpdate = () => {
    if (newQuantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    if (newQuantity > 9999) {
      setError('Maximum quantity is 9999');
      return;
    }

    onUpdate(mode === 'set' ? newQuantity : currentQuantity + newQuantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl shadow-black/50 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Restock Inventory</h2>
            <p className="text-sm text-gray-400">{listing?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="mb-6 p-4 bg-black/50 border border-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Current Stock</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${currentLevel.bgColor} border ${currentLevel.borderColor}`}>
              <span className={`text-sm font-semibold ${currentLevel.color}`}>{currentLevel.label}</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{currentQuantity} units</p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => {
              setMode('set');
              setNewQuantity(currentQuantity);
              setError('');
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'set'
                ? 'text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
            style={mode === 'set' ? { backgroundColor: '#8451E1' } : {}}
          >
            Set Amount
          </button>
          <button
            onClick={() => {
              setMode('add');
              setNewQuantity(0);
              setError('');
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'add'
                ? 'text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
            style={mode === 'add' ? { backgroundColor: '#8451E1' } : {}}
          >
            Add Amount
          </button>
        </div>

        {/* Quantity Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {mode === 'set' ? 'New Quantity' : 'Quantity to Add'}
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              disabled={mode === 'set' && newQuantity === 0}
              className="p-2.5 bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Decrease quantity"
            >
              <Minus className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="number"
              value={newQuantity}
              onChange={handleInputChange}
              className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-center font-semibold focus:outline-none focus:border-purple-500 transition-colors"
              min="0"
              max="9999"
            />
            <button
              onClick={handleIncrement}
              disabled={newQuantity >= 9999}
              className="p-2.5 bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Increase quantity"
            >
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Change Summary */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Change</span>
            <span className={`text-xl font-bold ${quantityChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {quantityChange >= 0 ? '+' : ''}{quantityChange}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">New Stock Level</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${newLevel.bgColor} border ${newLevel.borderColor}`}>
              <span className={`text-sm font-semibold ${newLevel.color}`}>{newLevel.label}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading || !!error || (currentQuantity === newQuantity && mode === 'set')}
            className="flex-1 px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: '#8451E1' }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Update Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestockModal;