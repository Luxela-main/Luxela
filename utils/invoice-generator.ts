/**
 * Invoice Generator Utility
 * Generates PDF invoices using jsPDF and html2canvas
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Order } from '@/types/buyer';

export interface InvoiceOptions {
  filename?: string;
  scale?: number;
}

/**
 * Creates a temporary invoice element with proper DOM rendering for pdf generation
 */
function createTemporaryInvoiceElement(order: Order): { container: HTMLElement; invoiceElement: HTMLElement } {
  // Create a main container
  const container = document.createElement('div');
  container.id = 'temp-invoice-container-' + Date.now();
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.visibility = 'visible';
  container.style.zIndex = '-10000';
  container.style.pointerEvents = 'none';
  container.style.opacity = '0';
  container.style.backgroundColor = '#ffffff';
  container.style.overflow = 'hidden';

  // Create invoice wrapper
  const invoiceWrapper = document.createElement('div');
  invoiceWrapper.id = 'invoice-content';
  invoiceWrapper.style.width = '210mm';
  invoiceWrapper.style.height = 'auto';
  invoiceWrapper.style.padding = '20px';
  invoiceWrapper.style.margin = '0 auto';
  invoiceWrapper.style.backgroundColor = '#ffffff';
  invoiceWrapper.style.boxSizing = 'border-box';
  invoiceWrapper.style.fontFamily = 'Arial, sans-serif';
  invoiceWrapper.style.fontSize = '14px';
  invoiceWrapper.style.lineHeight = '1.6';
  invoiceWrapper.style.color = '#000';

  // Get invoice summary
  const invoiceSummary = getInvoiceSummary(order);

  // Build invoice HTML
  invoiceWrapper.innerHTML = `
    <!-- Header with LUXELA Branding -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1a1a1a;">
      <div>
        <h1 style="font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0; letter-spacing: 2px; text-transform: uppercase;">LUXELA</h1>
        <p style="font-size: 11px; font-weight: 500; color: #666; margin: 4px 0 0 0; letter-spacing: 0.5px; text-transform: uppercase;">Fashion E-Commerce Platform</p>
      </div>
      <div style="text-align: right;">
        <h1 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 5px 0; letter-spacing: 1px;">INVOICE</h1>
        <p style="font-size: 13px; color: #666; margin: 0; font-weight: 500;">#${order.orderId}</p>
      </div>
    </div>

    <!-- Invoice Date & Total -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e8e8e8;">
      <div>
        <p style="font-size: 11px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Date</p>
        <p style="color: #333; margin: 0; font-weight: 600;">${formatInvoiceDate(order.createdAt)}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 11px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
        <p style="font-size: 20px; font-weight: 800; color: #1a1a1a; margin: 0;">${invoiceSummary.totalFormatted}</p>
      </div>
    </div>

    <!-- Customer & Seller Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
      <!-- Bill To -->
      <div>
        <h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Bill To</h3>
        <div style="font-size: 13px; color: #444; line-height: 1.8;">
          <p style="font-weight: 600; margin: 0 0 5px 0;">${order.customerName}</p>
          <p style="margin: 0 0 5px 0;">${order.customerEmail}</p>
          ${order.shippingAddress ? `<p style="margin: 0; color: #666;">${order.shippingAddress}</p>` : ''}
        </div>
      </div>

      <!-- Ship From -->
      <div>
        <h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Ship From</h3>
        <div style="font-size: 13px; color: #444; line-height: 1.8;">
          <p style="font-weight: 600; margin: 0 0 5px 0;">Our Store</p>
          <p style="margin: 0 0 5px 0;">Processing & Fulfillment Center</p>
          ${order.trackingNumber ? `<p style="margin: 5px 0 0 0; font-weight: 600;">Tracking: ${order.trackingNumber}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Order Details Table -->
    <table style="width: 100%; margin-bottom: 30px; font-size: 13px; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5; border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a;">
          <th style="text-align: left; padding: 12px; font-weight: bold; color: #333; border: 1px solid #ddd;">Item</th>
          <th style="text-align: center; padding: 12px; font-weight: bold; color: #333; border: 1px solid #ddd;">Quantity</th>
          <th style="text-align: right; padding: 12px; font-weight: bold; color: #333; border: 1px solid #ddd;">Unit Price</th>
          <th style="text-align: right; padding: 12px; font-weight: bold; color: #333; border: 1px solid #ddd;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 12px; color: #444; border: 1px solid #ddd;">
            <p style="font-weight: 700; margin: 0 0 8px 0; color: #1a1a1a;">${order.productTitle}</p>
            <p style="color: #888; font-size: 12px; margin: 0; font-weight: 500;">Category: ${order.productCategory}</p>
            ${order.sizes && order.sizes.length > 0 ? `<p style="color: #888; font-size: 12px; margin: 6px 0 0 0; font-weight: 500;">Sizes: <strong>${order.sizes.join(', ')}</strong></p>` : ''}
            ${order.colors && order.colors.length > 0 ? `<p style="color: #888; font-size: 12px; margin: 4px 0 0 0; font-weight: 500;">Colors: <strong>${order.colors.join(', ')}</strong></p>` : ''}
          </td>
          <td style="padding: 12px; text-align: center; color: #444; border: 1px solid #ddd;">${order.quantity || 1}</td>
          <td style="padding: 12px; text-align: right; color: #444; border: 1px solid #ddd;">${formatInvoicePrice(order.amountCents, order.currency)}</td>
          <td style="padding: 12px; text-align: right; color: #444; font-weight: 600; border: 1px solid #ddd;">${formatInvoicePrice(order.amountCents, order.currency)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Summary -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <div style="width: 100%; max-width: 350px;">
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; font-size: 13px;">
          <span style="color: #444;">Subtotal:</span>
          <span style="font-weight: 600; color: #333;">${invoiceSummary.subtotalFormatted}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; font-size: 13px;">
          <span style="color: #444;">Tax (7.5%):</span>
          <span style="font-weight: 600; color: #333;">${invoiceSummary.taxFormatted}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #ccc; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #444;">Shipping:</span>
          <span style="font-weight: 600; color: #333;">Free</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 15px; background-color: rgba(132, 81, 225, 0.15); border-radius: 4px;">
          <span style="font-weight: bold; color: #333; font-size: 16px;">Total:</span>
          <span style="font-weight: bold; color: #8451E1; font-size: 16px;">${invoiceSummary.totalFormatted}</span>
        </div>
      </div>
    </div>

    <!-- Payment & Delivery Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; margin-bottom: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <div>
        <h4 style="font-weight: bold; color: #333; margin: 0 0 8px 0;">Payment Details</h4>
        <p style="color: #666; margin: 4px 0;">Method: ${order.paymentMethod ? order.paymentMethod.replace('_', ' ').toUpperCase() : 'N/A'}</p>
        <p style="color: #666; margin: 4px 0;">Status: ${order.payoutStatus ? order.payoutStatus.replace('_', ' ').toUpperCase() : 'N/A'}</p>
      </div>
      <div>
        <h4 style="font-weight: bold; color: #333; margin: 0 0 8px 0;">Delivery Status</h4>
        <p style="color: #666; margin: 4px 0;">Status: ${order.orderStatus.toUpperCase()}</p>
        ${order.deliveredDate ? `<p style="color: #666; margin: 4px 0;">Delivered: ${formatInvoiceDate(order.deliveredDate)}</p>` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #ccc; padding-top: 20px; text-align: center; font-size: 11px; color: #666;">
      <p style="margin: 0 0 8px 0;">Thank you for your order!</p>
      <p style="margin: 0 0 8px 0;">If you have any questions about this invoice, please contact us at support@store.com</p>
      <p style="margin: 15px 0 0 0; color: #aaa;">Generated on ${new Date().toLocaleDateString()} • Invoice #${order.orderId}</p>
    </div>
  `;

  // Add to container
  container.appendChild(invoiceWrapper);
  document.body.appendChild(container);

  return { container, invoiceElement: invoiceWrapper };
}

/**
 * Generates and downloads an invoice as PDF
 */
export async function generateInvoicePDF(
  elementId: string,
  order: Order,
  options: InvoiceOptions = {}
) {
  const {
    filename = `invoice-${order.orderId}.pdf`,
    scale = 2,
  } = options;

  let tempContainer: HTMLElement | null = null;

  try {
    // Get or create element
    let element = document.getElementById(elementId);

    if (!element) {
      const { container, invoiceElement } = createTemporaryInvoiceElement(order);
      element = invoiceElement;
      tempContainer = container;
    }

    if (!element) {
      throw new Error('Invoice element could not be found or created');
    }

    // Ensure element is visible for html2canvas
    const originalOpacity = element.style.opacity;
    element.style.opacity = '1';

    // Wait for DOM rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
      imageTimeout: 0,
    });

    // Reset opacity
    element.style.opacity = originalOpacity;

    // Get canvas dimensions
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; 
    const pageHeight = 297; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Add pages
    while (heightLeft > 0) {
      if (position !== 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    // Download PDF
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  } finally {
    // Clean up temporary element
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

/**
 * Generates invoice data without saving to file
 */
export async function generateInvoiceData(
  elementId: string,
  order: Order,
  options: InvoiceOptions = {}
) {
  const {
    scale = 2,
  } = options;

  let tempContainer: HTMLElement | null = null;

  try {
    let element = document.getElementById(elementId);

    if (!element) {
      const { container, invoiceElement } = createTemporaryInvoiceElement(order);
      element = invoiceElement;
      tempContainer = container;
    }

    if (!element) {
      throw new Error('Invoice element could not be found or created');
    }

    // Ensure visibility
    const originalOpacity = element.style.opacity;
    element.style.opacity = '1';

    await new Promise(resolve => setTimeout(resolve, 100));

    // Convert to canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#000000',
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
      imageTimeout: 0,
    });

    element.style.opacity = originalOpacity;

    const imgData = canvas.toDataURL('image/png');

    return {
      success: true,
      data: imgData,
      order,
    };
  } catch (error) {
    console.error('Error generating invoice data:', error);
    throw error;
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

/**
 * Formats price for invoice display
 */
export function formatInvoicePrice(cents: number, currency = 'NGN'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency === 'NGN' ? 'NGN' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats date for invoice
 */
export function formatInvoiceDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Calculates tax
 */
export function calculateTax(amountCents: number, taxRate = 0.075): number {
  return Math.round(amountCents * taxRate);
}

/**
 * Generates invoice summary
 */
export function getInvoiceSummary(order: Order) {
  const subtotal = order.amountCents;
  const tax = calculateTax(subtotal);
  const shipping = 0; // Free shipping
  const total = subtotal + tax + shipping;

  return {
    subtotal,
    tax,
    shipping,
    total,
    subtotalFormatted: formatInvoicePrice(subtotal, order.currency),
    taxFormatted: formatInvoicePrice(tax, order.currency),
    shippingFormatted: formatInvoicePrice(shipping, order.currency),
    totalFormatted: formatInvoicePrice(total, order.currency),
  };
}