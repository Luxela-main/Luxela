import helper from "@/helper"; 

export const defaultDashboardData = {
    stats: {
      totalRevenue: {
        value: helper.toCurrency(0),
        change: "0%",
        changeType: "neutral" as const,
        subtext: `${helper.toCurrency(0)} today`,
      },
      totalSales: {
        value: helper.toCurrency(0),
        change: "0%",
        changeType: "neutral" as const,
        subtext: `${helper.toCurrency(0)} today`,
      },
      totalOrders: {
        value: "0",
        change: "0%",
        changeType: "neutral" as const,
        subtext: `${0} today`,
      },
      refunded: {
        value: "0",
        change: "0%",
        changeType: "neutral" as const,
        subtext: `${0} today`,
      },
    },
    revenueReport: [
      { month: "Jan", income: 0 },
      { month: "Feb", income: 0 },
      { month: "Mar", income: 0 },
      { month: "Apr", income: 0 },
      { month: "May", income: 0 },
      { month: "Jun", income: 0 },
      { month: "Jul", income: 0 },
      { month: "Aug", income: 0 },
      { month: "Sep", income: 0 },
      { month: "Oct", income: 0 },
      { month: "Nov", income: 0 },
      { month: "Dec", income: 0 },
    ],
    visitorTraffic: [
      { source: "Homepage Results", percentage: 0 },
      { source: "Category Browsing", percentage: 0 },
      { source: "Search Results", percentage: 0 },
      { source: "Shares", percentage: 0 },
    ],
    topSellingProducts: [],
  };