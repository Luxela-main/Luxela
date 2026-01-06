import cron from "node-cron";
import { db } from "../db";
import { sellers, orders, notifications } from "../db/schema";
import { sql, lt, or, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export function startInactiveSellerJob() {
  cron.schedule("0 9 * * MON", async () => {
    console.log("Checking for inactive sellers...");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const inactiveSellers = await db
      .select({ id: sellers.id })
      .from(sellers)
      .leftJoin(orders, sql`${sellers.id} = ${orders.sellerId}`)
      .groupBy(sellers.id)
      .having(
        or(
          sql`MAX(${orders.orderDate}) < ${oneWeekAgo}`,
          isNull(sql`MAX(${orders.orderDate})`)
        )
      );

    if (inactiveSellers.length === 0) {
      console.log("No inactive sellers found this week.");
      return;
    }

    // Send reminder notifications
    for (const seller of inactiveSellers) {
      await db.insert(notifications).values({
        id: randomUUID(),
        sellerId: seller.id,
        type: "reminder",
        message:
          "Hey! It’s been a while since your last sale. Add new listings or update your shop to stay visible!",
        createdAt: new Date(),
      });
    }

    console.log(`Sent ${inactiveSellers.length} inactive-seller reminders.`);
  });
}
