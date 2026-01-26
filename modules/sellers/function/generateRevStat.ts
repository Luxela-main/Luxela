import helper from "@/helper";

export const calculateStats = (sales: any[], listings: any[]) => {
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + (sale.amountCents || 0),
    0
  );
  const totalOrders = sales.length;
  const refundedOrders = sales.filter(
    (sale) => sale.orderStatus === "returned"
  ).length;

  const revenueChange = 8.4;

  return {
    totalRevenue: {
      value: helper.toCurrency(totalRevenue / 100),
      change: `${revenueChange}%`,
      changeType:
        revenueChange > 0 ? ("positive" as const) : ("negative" as const),
      subtext: `${helper.toCurrency((totalRevenue / 100) * 0.2)} today`,
    },
    totalSales: {
      value: helper.toCurrency(totalRevenue / 100),
      change: "13.4%",
      changeType: "positive" as const,
      subtext: `${helper.toCurrency((totalRevenue / 100) * 0.1)} today`,
    },
    totalOrders: {
      value: totalOrders.toString(),
      change: "3%",
      changeType: "positive" as const,
      subtext: `${Math.floor(totalOrders * 0.2)} today`,
    },
    refunded: {
      value: refundedOrders.toString(),
      change: "1%",
      changeType: "negative" as const,
      subtext: `${refundedOrders} today`,
    },
  };
};