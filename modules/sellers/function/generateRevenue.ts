export const generateRevenueReport = (sales: any[]) => {
  const monthlyData: { [key: string]: number } = {};

  sales.forEach((sale) => {
    const month = new Date(sale.orderDate).toLocaleDateString("en-US", {
      month: "short",
    });
    monthlyData[month] =
      (monthlyData[month] || 0) + (sale.amountCents || 0) / 100;
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month) => ({
    month,
    income: monthlyData[month] || 0,
  }));
};
