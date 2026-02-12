'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Users, ShoppingCart, CheckCircle } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

const COLORS = ['#8451E1', '#7C3AED', '#6D28D9', '#5B21B6'];

export default function EnhancedAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('funnel');

  
  const funnelQuery = trpc.adminAnalytics.getFunnelAnalysis.useQuery({ days });
  const sellerPerfQuery = trpc.adminAnalytics.getSellerPerformance.useQuery({ days, limit: 10 });
  const conversionQuery = trpc.adminAnalytics.getConversionAnalysis.useQuery({ days });
  const productPerfQuery = trpc.adminAnalytics.getProductPerformance.useQuery({ days });

  return (
    <div className="space-y-6">
      {}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Enhanced Analytics</h1>
          <p className="text-gray-400 mt-1">Detailed insights into your platform performance</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {}
      <div className="flex gap-2">
        {[7, 30, 90, 365].map((d) => (
          <Button
            key={d}
            variant={days === d ? 'default' : 'outline'}
            onClick={() => setDays(d)}
            className={days === d ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            {d === 7 ? '7 days' : d === 30 ? '30 days' : d === 90 ? '90 days' : '1 year'}
          </Button>
        ))}
      </div>

      {}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black border border-gray-800">
          <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
          <TabsTrigger value="sellers">Seller Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>

        {}
        <TabsContent value="funnel" className="space-y-6">
          {funnelQuery.data?.stages && funnelQuery.data.stages.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {funnelQuery.data.stages.map((stage: typeof funnelQuery.data.stages[number]) => (
                  <Card key={stage.stage} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium capitalize">{stage.stage.replace(/_/g, ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-light">{stage.count}</div>
                      <div className="text-xs text-gray-400 mt-2">
                        <span>{stage.percentage.toFixed(1)}% of browsers</span>
                        {stage.dropoffRate > 0 && (
                          <div className="text-red-400 mt-1">↓ {stage.dropoffRate.toFixed(1)}% dropoff</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Funnel Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelQuery.data.stages?.map((stage: typeof funnelQuery.data.stages[number], idx: number) => (
                      <div key={stage.stage}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{stage.stage.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-gray-400">{stage.count} ({stage.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${stage.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Overall Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-light">{funnelQuery.data.conversionRate.toFixed(2)}%</div>
                    <p className="text-xs text-gray-400 mt-2">Browsers → Completed Orders</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Average Cart Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-light">${funnelQuery.data.averageCartValue.toFixed(2)}</div>
                    <p className="text-xs text-gray-400 mt-2">Per cart</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {}
        <TabsContent value="sellers" className="space-y-6">
          {sellerPerfQuery.data && Array.isArray(sellerPerfQuery.data) && sellerPerfQuery.data.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-light">Top Selling Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sellerPerfQuery.data.map((seller: typeof sellerPerfQuery.data[number], idx: number) => (
                    <div key={seller.sellerId} className="border-b border-gray-800 pb-4 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-purple-400 border-purple-400">#{idx + 1}</Badge>
                            <span className="font-medium">{seller.sellerName}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Quality Score: <span className="text-yellow-400">{seller.quality_score.toFixed(1)}/100</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium">${seller.totalRevenue.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">{seller.totalOrders} orders</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-gray-400">Rating</span>
                          <div className="font-medium text-yellow-400 mt-1">{seller.averageRating.toFixed(1)} ⭐</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Completion</span>
                          <div className="font-medium text-green-400 mt-1">{seller.completionRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Reviews</span>
                          <div className="font-medium mt-1">{seller.reviewCount}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Listings</span>
                          <div className="font-medium mt-1">{seller.activeListings}/{seller.totalListings}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {}
        <TabsContent value="conversion" className="space-y-6">
          {conversionQuery.data && Array.isArray(conversionQuery.data) && conversionQuery.data.length > 0 && (
            <>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Daily Conversion Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={conversionQuery.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8451E1"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light">
                      {conversionQuery.data.reduce((sum: number, d: typeof conversionQuery.data[number]) => sum + d.conversions, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light">
                      ${conversionQuery.data.reduce((sum: number, d: typeof conversionQuery.data[number]) => sum + d.revenue, 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-light">
                      ${
                        conversionQuery.data.reduce((sum: number, d: typeof conversionQuery.data[number]) => sum + d.avgOrderValue, 0) /
                        conversionQuery.data.length
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {}
        <TabsContent value="products" className="space-y-6">
          {productPerfQuery.data && Array.isArray(productPerfQuery.data) && productPerfQuery.data.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-light">Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productPerfQuery.data.map((product: typeof productPerfQuery.data[number], idx: number) => (
                    <div key={product.listingId} className="border-b border-gray-800 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-600">{idx + 1}</Badge>
                            <div>
                              <div className="font-medium text-sm">{product.title}</div>
                              <div className="text-xs text-gray-400">{product.category}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${product.revenue.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">{product.sales} sales</div>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>⭐ {product.avgRating.toFixed(1)} ({product.reviewCount} reviews)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}