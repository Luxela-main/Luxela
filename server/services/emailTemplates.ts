/**
 * Email Template Service
 * Provides professionally designed HTML email templates for all transaction events
 */

export interface EmailContext {
  buyerName?: string;
  sellerName?: string;
  orderId: string;
  productName?: string;
  amount?: number;
  currency?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  paymentStatus?: string;
  deliveryStatus?: string;
  refundAmount?: number;
  reason?: string;
}

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #f5f5f5;
    padding: 20px;
  }
  .email-wrapper {
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #8451e1 0%, #6b3bb8 100%);
    color: white;
    padding: 40px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .section {
    margin-bottom: 30px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
    border-bottom: 2px solid #8451e1;
    padding-bottom: 10px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #eee;
  }
  .info-label {
    color: #666;
    font-weight: 500;
  }
  .info-value {
    color: #333;
    font-weight: 600;
  }
  .status-badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-success {
    background: #d4edda;
    color: #155724;
  }
  .status-pending {
    background: #fff3cd;
    color: #856404;
  }
  .status-processing {
    background: #d1ecf1;
    color: #0c5460;
  }
  .cta-button {
    display: inline-block;
    background: #8451e1;
    color: white;
    padding: 12px 30px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 20px;
    text-align: center;
  }
  .cta-button:hover {
    background: #6b3bb8;
  }
  .timeline {
    position: relative;
    padding-left: 30px;
  }
  .timeline-item {
    margin-bottom: 20px;
    position: relative;
  }
  .timeline-dot {
    position: absolute;
    left: -30px;
    top: 3px;
    width: 12px;
    height: 12px;
    background: #8451e1;
    border-radius: 50%;
    border: 3px solid white;
  }
  .timeline-item.pending .timeline-dot {
    background: #ccc;
  }
  .timeline-title {
    font-weight: 600;
    color: #333;
    margin-bottom: 5px;
  }
  .timeline-date {
    font-size: 12px;
    color: #999;
  }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #666;
  }
  .divider {
    height: 1px;
    background: #eee;
    margin: 30px 0;
  }
`;

/**
 * Order Confirmation Email
 */
export function generateOrderConfirmationEmail(context: EmailContext): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>🎉 Order Confirmed!</h1>
            <p>Your order has been successfully placed</p>
          </div>

          <div class="content">
            <p>Hi ${context.buyerName || 'Valued Customer'},</p>
            <p>Thank you for your purchase! Your order is now confirmed and being prepared for shipment.</p>

            <div class="section">
              <div class="section-title">Order Details</div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">#${context.orderId.slice(0, 12)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Product</span>
                <span class="info-value">${context.productName || 'Fashion Item'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount</span>
                <span class="info-value">${context.currency || '$'}${(context.amount || 0).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value"><span class="status-badge status-success">✓ Confirmed</span></span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">What's Next?</div>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Order Confirmed</div>
                  <div class="timeline-date">Just now</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">Processing</div>
                  <div class="timeline-date">1-2 business days</div>
                </div>
                <div class="timeline-item pending">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">Shipped</div>
                  <div class="timeline-date">Soon</div>
                </div>
                <div class="timeline-item pending">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">Out for Delivery</div>
                  <div class="timeline-date">Pending</div>
                </div>
                <div class="timeline-item pending">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">Delivered</div>
                  <div class="timeline-date">${context.estimatedDeliveryDate ? context.estimatedDeliveryDate.toLocaleDateString() : 'TBD'}</div>
                </div>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="https://luxela.com/orders/${context.orderId}" class="cta-button">
                Track Your Order
              </a>
            </p>

            <div class="divider"></div>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
          </div>

          <div class="footer">
            <p>© 2025 Luxela Fashion. All rights reserved.</p>
            <p>You received this email because you placed an order with us.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Delivery Confirmation Email
 */
export function generateDeliveryConfirmationEmail(context: EmailContext): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>📦 Delivered!</h1>
            <p>Your order has arrived</p>
          </div>

          <div class="content">
            <p>Hi ${context.buyerName || 'Valued Customer'},</p>
            <p>Great news! Your order has been successfully delivered. We hope you enjoy your purchase!</p>

            <div class="section">
              <div class="section-title">Delivery Confirmation</div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">#${context.orderId.slice(0, 12)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Product</span>
                <span class="info-value">${context.productName || 'Fashion Item'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value"><span class="status-badge status-success">✓ Delivered</span></span>
              </div>
              ${context.trackingNumber ? `
              <div class="info-row">
                <span class="info-label">Tracking Number</span>
                <span class="info-value" style="font-family: monospace;">${context.trackingNumber}</span>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Your Order Journey</div>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Order Confirmed</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Processing</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Shipped</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Out for Delivery</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-title">✓ Delivered</div>
                </div>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="https://luxela.com/orders/${context.orderId}" class="cta-button">
                View Order Details
              </a>
            </p>

            <div class="divider"></div>
            
            <h3 style="margin-top: 20px;">What's Next?</h3>
            <ul style="line-height: 1.8;">
              <li>Inspect your order to ensure everything is as expected</li>
              <li>If there are any issues, contact us within 7 days</li>
              <li>Leave a review to help other customers</li>
              <li>Join our loyalty program for exclusive offers</li>
            </ul>
          </div>

          <div class="footer">
            <p>© 2025 Luxela Fashion. All rights reserved.</p>
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Payment Received Email (for Seller)
 */
export function generatePaymentReceivedEmail(context: EmailContext): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>💰 Payment Received!</h1>
            <p>You have a new order</p>
          </div>

          <div class="content">
            <p>Hi ${context.sellerName || 'Seller'},</p>
            <p>You've received a new order! Payment has been secured in escrow and is ready for processing.</p>

            <div class="section">
              <div class="section-title">Order Summary</div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">#${context.orderId.slice(0, 12)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Product</span>
                <span class="info-value">${context.productName || 'Item'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Amount</span>
                <span class="info-value" style="color: #28a745; font-size: 18px;">${context.currency || '$'}${(context.amount || 0).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Status</span>
                <span class="info-value"><span class="status-badge status-success">✓ In Escrow</span></span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Important Information</div>
              <ul style="line-height: 1.8;">
                <li>✓ Payment is held safely in escrow</li>
                <li>✓ Please prepare the order for shipment</li>
                <li>✓ Update delivery status when shipped</li>
                <li>✓ Confirm delivery when buyer confirms receipt</li>
                <li>✓ Payment released after delivery confirmation</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="https://luxela.com/sellers/sales" class="cta-button">
                View Sales Dashboard
              </a>
            </p>
          </div>

          <div class="footer">
            <p>© 2025 Luxela Fashion. All rights reserved.</p>
            <p>Secure payment processing powered by our escrow system</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Refund Issued Email
 */
export function generateRefundIssuedEmail(context: EmailContext): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>💸 Refund Processed</h1>
            <p>Your refund has been issued</p>
          </div>

          <div class="content">
            <p>Hi ${context.buyerName || 'Valued Customer'},</p>
            <p>Your refund has been processed and will be reflected in your account within 3-5 business days.</p>

            <div class="section">
              <div class="section-title">Refund Details</div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">#${context.orderId.slice(0, 12)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Refund Amount</span>
                <span class="info-value" style="color: #28a745; font-size: 18px;">${context.currency || '$'}${(context.refundAmount || 0).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Reason</span>
                <span class="info-value">${context.reason || 'Refund requested'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value"><span class="status-badge status-success">✓ Processed</span></span>
              </div>
            </div>

            <div class="divider"></div>
            <p><strong>Timeline:</strong></p>
            <ul>
              <li>Refund processed: Today</li>
              <li>Expected in account: 3-5 business days</li>
            </ul>

            <p style="text-align: center;">
              <a href="https://luxela.com/orders/${context.orderId}" class="cta-button">
                View Order Details
              </a>
            </p>
          </div>

          <div class="footer">
            <p>© 2025 Luxela Fashion. All rights reserved.</p>
            <p>If you have questions, contact our support team</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Shipping Notification Email
 */
export function generateShippingNotificationEmail(context: EmailContext): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="email-wrapper">
          <div class="header">
            <h1>🚚 Order Shipped!</h1>
            <p>Your order is on its way</p>
          </div>

          <div class="content">
            <p>Hi ${context.buyerName || 'Valued Customer'},</p>
            <p>Your order has been shipped! Track your package using the information below.</p>

            <div class="section">
              <div class="section-title">Shipping Information</div>
              <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">#${context.orderId.slice(0, 12)}</span>
              </div>
              ${context.trackingNumber ? `
              <div class="info-row">
                <span class="info-label">Tracking Number</span>
                <span class="info-value" style="font-family: monospace; font-weight: bold;">${context.trackingNumber}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value"><span class="status-badge status-processing">⏱ In Transit</span></span>
              </div>
              ${context.estimatedDeliveryDate ? `
              <div class="info-row">
                <span class="info-label">Estimated Delivery</span>
                <span class="info-value">${context.estimatedDeliveryDate.toLocaleDateString()}</span>
              </div>
              ` : ''}
            </div>

            <p style="text-align: center;">
              <a href="https://luxela.com/orders/${context.orderId}" class="cta-button">
                Track Your Package
              </a>
            </p>

            <div class="divider"></div>
            <p>You can track your package in real-time on our platform. You'll receive another notification when your order is out for delivery.</p>
          </div>

          <div class="footer">
            <p>© 2025 Luxela Fashion. All rights reserved.</p>
            <p>Thank you for your patience!</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}