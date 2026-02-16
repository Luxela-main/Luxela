'use client';

import { getInvoiceSummary, formatInvoicePrice, formatInvoiceDate } from '@/utils/invoice-generator';
import type { Order } from '@/types/buyer';

interface InvoiceDisplayProps {
  order: Order;
  hideActionButtons?: boolean;
}

export function InvoiceDisplay({ order, hideActionButtons = false }: InvoiceDisplayProps) {
  const invoiceSummary = getInvoiceSummary(order);

  return (
    <div
      id="invoice-content"
      className="bg-white text-black p-8 rounded-lg"
      style={{
        width: '100%',
        maxWidth: '900px',
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.6',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
        <div>
          <h1 className="text-3xl font-bold text-[#8451E1] mb-2">INVOICE</h1>
          <p className="text-gray-600">Order ID: {order.orderId}</p>
          <p className="text-gray-600">Invoice Date: {formatInvoiceDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#8451E1] mb-2">
            {invoiceSummary.totalFormatted}
          </p>
          <p className="text-sm text-gray-600">Total Amount</p>
        </div>
      </div>

      {/* Customer & Seller Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Bill To
          </h3>
          <div className="text-sm text-gray-700">
            <p className="font-semibold">{order.customerName}</p>
            <p>{order.customerEmail}</p>
            {order.shippingAddress && (
              <p className="mt-2 text-gray-600">{order.shippingAddress}</p>
            )}
          </div>
        </div>

        {/* Ship From */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Ship From
          </h3>
          <div className="text-sm text-gray-700">
            <p className="font-semibold">{order.sellerStoreName || 'Our Store'}</p>
            {order.sellerName && (
              <p>{order.sellerName}</p>
            )}
            {order.sellerEmail && (
              <p>{order.sellerEmail}</p>
            )}
            {order.trackingNumber && (
              <p className="mt-2 font-semibold">Tracking: {order.trackingNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="bg-[#8451E1]/10 border-b-2 border-[#8451E1]">
            <th className="text-left p-3 font-bold text-gray-800">Item</th>
            <th className="text-center p-3 font-bold text-gray-800">Quantity</th>
            <th className="text-right p-3 font-bold text-gray-800">Unit Price</th>
            <th className="text-right p-3 font-bold text-gray-800">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="p-3 text-gray-700">
              <p className="font-semibold">{order.productTitle}</p>
              <p className="text-gray-500 text-xs mt-1">
                Category: {order.productCategory}
              </p>
              {order.sizes && order.sizes.length > 0 && (
                <p className="text-gray-500 text-xs">Sizes: {order.sizes.join(', ')}</p>
              )}
              {order.colors && order.colors.length > 0 && (
                <p className="text-gray-500 text-xs">Colors: {order.colors.join(', ')}</p>
              )}
            </td>
            <td className="p-3 text-center text-gray-700">
              {order.quantity || 1}
            </td>
            <td className="p-3 text-right text-gray-700">
              {formatInvoicePrice(order.amountCents, order.currency)}
            </td>
            <td className="p-3 text-right text-gray-700 font-semibold">
              {formatInvoicePrice(order.amountCents, order.currency)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-xs">
          {/* Subtotal */}
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-800">
              {invoiceSummary.subtotalFormatted}
            </span>
          </div>

          {/* Tax */}
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-700">Tax (7.5%):</span>
            <span className="font-semibold text-gray-800">
              {invoiceSummary.taxFormatted}
            </span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between py-2 border-b-2 border-gray-300 mb-3">
            <span className="text-gray-700">Shipping:</span>
            <span className="font-semibold text-gray-800">Free</span>
          </div>

          {/* Total */}
          <div className="flex justify-between py-3 bg-[#8451E1]/10 px-3 rounded">
            <span className="font-bold text-gray-800 text-lg">Total:</span>
            <span className="font-bold text-[#8451E1] text-lg">
              {invoiceSummary.totalFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Payment & Delivery Info */}
      <div className="grid grid-cols-2 gap-6 text-sm mb-8 pt-6 border-t border-gray-200">
        {/* Payment Info */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Payment Details</h4>
          <p className="text-gray-600">
            Method: {order.paymentMethod.replace('_', ' ').toUpperCase()}
          </p>
          <p className="text-gray-600">
            Status: {order.payoutStatus.replace('_', ' ').toUpperCase()}
          </p>
        </div>

        {/* Order Status */}
        <div>
          <h4 className="font-bold text-gray-800 mb-2">Delivery Status</h4>
          <p className="text-gray-600">
            Status: {order.orderStatus.toUpperCase()}
          </p>
          {order.deliveredDate && (
            <p className="text-gray-600">
              Delivered: {formatInvoiceDate(order.deliveredDate)}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 text-center text-xs text-gray-600">
        <p className="mb-2">Thank you for your order!</p>
        <p>
          If you have any questions about this invoice, please contact us at support@theluxela.com
        </p>
        <p className="mt-4 text-gray-400">
          Generated on {new Date().toLocaleDateString()} • Invoice #{order.orderId}
        </p>
      </div>
    </div>
  );
}