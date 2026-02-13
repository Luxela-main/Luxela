import { createTRPCRouter } from './trpc';
import { adminAnalyticsRouter } from '../routers/admin-analytics';
import { adminAuditLogsRouter } from '../routers/admin-audit-logs';
import { adminListingReviewRouter } from '../routers/admin-listing-review';
import { adminMembersRouter } from '../routers/admin-members';
import { adminNotificationsRouter } from '../routers/admin-notifications';
import { adminReportGeneratorRouter } from '../routers/admin-report-generator';
import { adminSettingsRouter } from '../routers/admin-settings';
import { brandsRouter } from '../routers/brands';
import { buyerListingsCatalogRouter } from '../routers/buyer-listings-catalog';
import { buyerNotificationsRouter } from '../routers/buyer-notifications-unified';
import { buyerOrderActionsRouter } from '../routers/buyerOrderActions';
import { buyerRouter } from '../routers/buyer';
import { cartRouter } from '../routers/cart';
import { checkoutRouter } from '../routers/checkout';
import { collectionRouter } from '../routers/collection';
import { cronRouter } from '../routers/cron';
import { emailNotificationRouter } from '../routers/emailNotification';
import { escrowRouter } from '../routers/escrow';
import { faqsRouter } from '../routers/faqs';
import { financeRouter } from '../routers/finance';
import { inventoryRouter } from '../routers/inventory';
import { listingRouter } from '../routers/listing';
import { notificationRouter } from '../routers/notification';
import { orderStatusRouter } from '../routers/orderStatus';
import { paymentRouter } from '../routers/payment';
import { paymentConfirmationRouter } from '../routers/paymentConfirmation';
import { payoutSubscriptionsRouter } from '../routers/payoutSubscriptions';
import { payoutVerificationRouter } from '../routers/payoutVerification';
import { productRouter } from '../routers/product';
import { productsRouter } from '../routers/products';
import { refundRouter } from '../routers/refund';
import { returnsRouter } from '../routers/returns';
import { reviewRouter } from '../routers/review';
import { salesRouter } from '../routers/sales';
import { sellerListingNotificationsRouter } from '../routers/seller-listing-notifications';
import { sellerNotificationsRouter } from '../routers/seller-notifications-unified';
import { sellerRouter } from '../routers/seller';
import { sellerOrdersRouter } from '../routers/sellerOrders';
import { shippingRouter } from '../routers/shipping';
import { supportAdminRouter } from '../routers/support-admin';
import { supportRouter } from '../routers/support';
import { supportSubscriptionsRouter } from '../routers/supportSubscriptions';
import { variantsRouter } from '../routers/variantsRouter';
import { webhookRouter } from '../routers/webhook';

export const appRouter = createTRPCRouter({
  adminAnalytics: adminAnalyticsRouter,
  adminAuditLogs: adminAuditLogsRouter,
  adminListingReview: adminListingReviewRouter,
  adminMembers: adminMembersRouter,
  adminNotifications: adminNotificationsRouter,
  adminReportGenerator: adminReportGeneratorRouter,
  adminSettings: adminSettingsRouter,

  brands: brandsRouter,
  buyerListingsCatalog: buyerListingsCatalogRouter,
  buyerNotifications: buyerNotificationsRouter,
  buyerOrderActions: buyerOrderActionsRouter,
  buyer: buyerRouter,
  cart: cartRouter,
  checkout: checkoutRouter,
  collection: collectionRouter,
  cron: cronRouter,
  emailNotification: emailNotificationRouter,
  escrow: escrowRouter,
  faqs: faqsRouter,
  finance: financeRouter,
  inventory: inventoryRouter,
  listing: listingRouter,
  notification: notificationRouter,
  orderStatus: orderStatusRouter,
  payment: paymentRouter,
  paymentConfirmation: paymentConfirmationRouter,
  payoutSubscriptions: payoutSubscriptionsRouter,
  payoutVerification: payoutVerificationRouter,
  product: productRouter,
  products: productsRouter,
  refund: refundRouter,
  returns: returnsRouter,
  review: reviewRouter,
  sales: salesRouter,
  sellerListingNotifications: sellerListingNotificationsRouter,
  sellerNotifications: sellerNotificationsRouter,
  seller: sellerRouter,
  sellerOrders: sellerOrdersRouter,
  shipping: shippingRouter,
  supportAdmin: supportAdminRouter,
  support: supportRouter,
  supportSubscriptions: supportSubscriptionsRouter,
  variants: variantsRouter,
  webhook: webhookRouter,
});

export type AppRouter = typeof appRouter;