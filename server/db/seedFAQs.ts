#!/usr/bin/env node
/**
 * FAQ Database Seed Script
 * Run with: npx tsx server/db/seedFAQs.ts
 * 
 * This script populates the database with initial FAQ data
 * for both buyers and sellers from hardcoded seed data.
 */

import { db } from './index';
import { faqs } from './schema';
import { v4 as uuidv4 } from 'uuid';

// Use a fixed UUID for system admin (will be used for all seed data)
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';

const buyerFaqSeeds = [
  {
    id: uuidv4(),
    question: 'How do I place an order?',
    answer: 'Browse our collections, select your desired items, check size and color options, add to cart, and proceed to checkout. Follow the payment instructions to complete your purchase securely.',
    category: 'orders',
    userRole: 'buyer' as const,
    order: 0,
  },
  {
    id: uuidv4(),
    question: 'What is your return and exchange policy?',
    answer: 'We offer 30-day returns and exchanges for most items in original condition with tags attached. Visit the Returns & Refunds section to initiate a return. Original shipping costs are non-refundable.',
    category: 'returns',
    userRole: 'buyer' as const,
    order: 1,
  },
  {
    id: uuidv4(),
    question: 'How can I track my order?',
    answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also check your order status in the Orders section of your dashboard for real-time updates.',
    category: 'orders',
    userRole: 'buyer' as const,
    order: 2,
  },
  {
    id: uuidv4(),
    question: 'Do you offer international shipping?',
    answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. International orders may have customs and import duties applied by your country.',
    category: 'shipping',
    userRole: 'buyer' as const,
    order: 3,
  },
  {
    id: uuidv4(),
    question: 'How do I find my correct size?',
    answer: 'Each product includes a detailed size chart. We recommend measuring according to our guidelines. If unsure, contact our support team for personalized sizing recommendations.',
    category: 'products',
    userRole: 'buyer' as const,
    order: 4,
  },
  {
    id: uuidv4(),
    question: 'What payment methods do you accept?',
    answer: 'We accept credit cards (Visa, Mastercard, Amex), debit cards, PayPal, and other digital payment methods depending on your location. All payments are securely processed.',
    category: 'payments',
    userRole: 'buyer' as const,
    order: 5,
  },
  {
    id: uuidv4(),
    question: 'How long does delivery take?',
    answer: 'Standard delivery typically takes 5-7 business days within the country. Express shipping options are available at checkout. International orders may take 2-3 weeks depending on destination.',
    category: 'shipping',
    userRole: 'buyer' as const,
    order: 6,
  },
  {
    id: uuidv4(),
    question: 'Can I cancel or modify my order?',
    answer: 'You can cancel or modify your order within 24 hours of placement. After that, your order enters fulfillment and cannot be changed. Contact support if you need assistance.',
    category: 'orders',
    userRole: 'buyer' as const,
    order: 7,
  },
];

const sellerFaqSeeds = [
  {
    id: uuidv4(),
    question: 'How do I list a new product on Luxela?',
    answer: 'Click on \'New Listing\' in the sidebar menu. Fill in the product details including title, description, images, price, and inventory. Add at least 3-5 high-quality images. Our guidelines recommend clear product photos with multiple angles and lifestyle shots. Once approved by our review team, your listing will go live.',
    category: 'listings',
    userRole: 'seller' as const,
    order: 0,
  },
  {
    id: uuidv4(),
    question: 'What are the commission rates?',
    answer: 'Commission rates vary by category but typically range from 8-15% of the sale price. Service fees of 2.9% + fixed amount apply to each transaction. You can view category-specific rates in your account settings. Premium sellers may qualify for reduced commissions.',
    category: 'payments',
    userRole: 'seller' as const,
    order: 1,
  },
  {
    id: uuidv4(),
    question: 'When and how do I get paid?',
    answer: 'Payments are processed every 7 days to your registered bank account or payment method. Funds are released after the order is delivered and the customer confirms receipt. You can track your earnings in the Payouts section.',
    category: 'payments',
    userRole: 'seller' as const,
    order: 2,
  },
  {
    id: uuidv4(),
    question: 'How do I handle returns and refunds?',
    answer: 'When a customer initiates a return, you\'ll receive a notification. Inspect the returned item and approve or reject the refund within 48 hours. Approved refunds are processed within 3-5 business days. Items in original condition with tags are eligible for full refunds.',
    category: 'returns',
    userRole: 'seller' as const,
    order: 3,
  },
  {
    id: uuidv4(),
    question: 'What happens if a customer disputes an order?',
    answer: 'We\'ll notify you immediately of any disputes. You have 48 hours to respond with evidence (tracking info, photos, etc.). Our support team will review both sides and make a fair decision. Most disputes are resolved within 5 business days.',
    category: 'disputes',
    userRole: 'seller' as const,
    order: 4,
  },
  {
    id: uuidv4(),
    question: 'How can I improve my seller rating?',
    answer: 'Maintain a 4.5+ star rating by: providing accurate product descriptions, using high-quality images, shipping promptly, packaging well, and communicating clearly with customers. Respond to messages within 24 hours and resolve issues quickly to build trust.',
    category: 'seller_ratings',
    userRole: 'seller' as const,
    order: 5,
  },
  {
    id: uuidv4(),
    question: 'Can I edit a listing that\'s already live?',
    answer: 'Yes, you can edit product details, prices, and inventory at any time. However, once an order is placed, you cannot change the product specifications for that order. Major changes like category may require re-approval by our review team.',
    category: 'listings',
    userRole: 'seller' as const,
    order: 6,
  },
  {
    id: uuidv4(),
    question: 'What are the best practices for product descriptions?',
    answer: 'Write clear, detailed descriptions including dimensions, materials, care instructions, and unique features. Use simple language and highlight key benefits. Include shipping and handling information. Good descriptions reduce returns and inquiries from customers.',
    category: 'listings',
    userRole: 'seller' as const,
    order: 7,
  },
  {
    id: uuidv4(),
    question: 'How do I monitor my sales performance?',
    answer: 'Use the Sales and Reports section in your dashboard. Track metrics like total revenue, number of orders, conversion rates, and customer reviews. Export reports for detailed analysis. Our analytics help you identify trends and optimize your listings.',
    category: 'analytics',
    userRole: 'seller' as const,
    order: 8,
  },
  {
    id: uuidv4(),
    question: 'What should I do if my account is suspended?',
    answer: 'Review the suspension notice for the specific reason. Common reasons include policy violations, low ratings, or suspicious activity. Contact our support team immediately with evidence of your compliance. You can appeal within 30 days of suspension.',
    category: 'account',
    userRole: 'seller' as const,
    order: 9,
  },
];

const allFaqSeeds = [...buyerFaqSeeds, ...sellerFaqSeeds];

async function seedFAQs() {
  try {
    console.log('🌱 Starting FAQ seed process...');
    
    // Check if FAQs already exist
    const existingFaqs = await db.select().from(faqs).limit(1);
    
    if (existingFaqs.length > 0) {
      console.log('✅ FAQs already exist in database. Skipping seed.');
      return;
    }
    
    // Insert FAQs in batches to avoid parameter limit issues
    const BATCH_SIZE = 3;
    const now = new Date();
    
    console.log(`📝 Inserting ${allFaqSeeds.length} FAQs into database in batches...`);
    
    for (let i = 0; i < allFaqSeeds.length; i += BATCH_SIZE) {
      const batch = allFaqSeeds.slice(i, i + BATCH_SIZE);
      await db.insert(faqs).values(
        batch.map((faq: any) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          userRole: faq.userRole,
          order: faq.order,
          active: true,
          views: 0,
          helpful: 0,
          notHelpful: 0,
          tags: null,
          createdBy: ADMIN_ID,
          updatedBy: ADMIN_ID,
          createdAt: now,
          updatedAt: now,
        }))
      );
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const endIdx = Math.min(i + BATCH_SIZE, allFaqSeeds.length);
      console.log(`  ✓ Inserted batch ${batchNum} (FAQs ${i + 1}-${endIdx})`);
    }
    
    console.log(`✅ Successfully seeded ${allFaqSeeds.length} FAQs`);
    console.log(`   - ${buyerFaqSeeds.length} buyer FAQs`);
    console.log(`   - ${sellerFaqSeeds.length} seller FAQs`);
    
  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    throw error;
  }
}

// Run the seed function
(async () => {
  try {
    await seedFAQs();
    console.log('🎉 FAQ seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();