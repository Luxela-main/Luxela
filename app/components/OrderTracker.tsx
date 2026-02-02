'use client';

import React from 'react';
import { CheckCircle, Clock, Truck, Package, AlertCircle } from 'lucide-react';

interface TrackingStep {
  label: string;
  description?: string;
  completed: boolean;
  date?: Date;
  icon?: React.ReactNode;
}

interface OrderTrackerProps {
  steps: TrackingStep[];
  currentStatus: string;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  className?: string;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  steps,
  currentStatus,
  estimatedDelivery,
  trackingNumber,
  className = '',
}) => {
  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return <CheckCircle className="text-green-500" size={20} />;
    if (s === 'shipped' || s === 'in_transit') return <Truck className="text-blue-500" size={20} />;
    if (s === 'processing') return <Clock className="text-yellow-500" size={20} />;
    if (s === 'canceled') return <AlertCircle className="text-red-500" size={20} />;
    return <Package className="text-gray-500" size={20} />;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'text-green-400';
    if (s === 'shipped' || s === 'in_transit') return 'text-blue-400';
    if (s === 'processing') return 'text-yellow-400';
    if (s === 'canceled') return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusMessage = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered')
      return 'Your order has been delivered successfully.';
    if (s === 'shipped') return 'Your package is on its way!';
    if (s === 'in_transit') return 'Package in transit to your location';
    if (s === 'processing') return 'We are preparing your order';
    if (s === 'canceled') return 'Your order has been canceled';
    return 'Order placed successfully';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Current Status Summary */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Order Status</h3>
          <div className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            <span className={`font-semibold ${getStatusColor(currentStatus)} capitalize`}>
              {currentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
        <p className="text-gray-300 text-sm">{getStatusMessage(currentStatus)}</p>

        {trackingNumber && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <p className="text-gray-400 text-xs">Tracking Number</p>
            <p className="text-white font-mono text-sm mt-1">{trackingNumber}</p>
          </div>
        )}

        {estimatedDelivery && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <p className="text-gray-400 text-xs">Estimated Delivery</p>
            <p className="text-white font-semibold mt-1">
              {estimatedDelivery.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
        <h3 className="text-white font-semibold mb-6">Order Timeline</h3>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              {/* Timeline Dot and Line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.completed
                      ? 'bg-[#8451e1] border-[#8451e1]'
                      : 'border-[#333] bg-[#0e0e0e]'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="text-white" size={20} />
                  ) : (
                    <Clock className="text-[#666]" size={20} />
                  )}
                </div>

                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-16 mt-2 ${
                      step.completed ? 'bg-[#8451e1]' : 'bg-[#333]'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pt-2 flex-1">
                <h4 className={`font-semibold ${step.completed ? 'text-white' : 'text-gray-400'}`}>
                  {step.label}
                </h4>

                {step.description && (
                  <p className="text-gray-400 text-sm mt-1">{step.description}</p>
                )}

                {step.date && (
                  <p className="text-gray-500 text-xs mt-2">
                    {step.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-sm flex items-start gap-2">
          <span className="mt-0.5">💡</span>
          <span>
            You will receive email notifications for each milestone. Contact the seller if you have any
            concerns about your delivery.
          </span>
        </p>
      </div>
    </div>
  );
};

export default OrderTracker;