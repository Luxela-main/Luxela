import cron from "node-cron";
import { db } from "../db";
import { orders, notifications } from "../db/schema";
import { eq, lt, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export function startBuyerFollowUpJob() {
 
  cron.schedule("0 0 * * *", async () => {
    console.log("Running buyer review reminder job...");

   
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find orders delivered more than 3 days ago
    const deliveredOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.deliveryStatus, "delivered"),
          lt(orders.orderDate, threeDaysAgo)
        )
      );

    
    for (const order of deliveredOrders) {
      await db.insert(notifications).values({
        id: randomUUID(),
        type: "reminder",
        message: `Hey ${order.customerName}, your order "${order.productTitle}" was delivered 3 days ago. Please leave a review!`,
        isRead: false,
        isStarred: false,
        createdAt: new Date(),
      });
    }

    console.log("Buyer review reminders sent!");
  });
}
