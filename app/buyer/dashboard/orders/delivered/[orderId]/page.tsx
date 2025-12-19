import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { Button } from "@/components/ui/button"
import { OrderTabs } from "@/components/dashboard/order-tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function DeliveredOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/dashboard" }, { label: "Orders", href: "/dashboard/orders" }, { label: "Delivered Orders" }]}
      />

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-white text-2xl font-semibold">Delivered Orders</h1>
        <span className="flex items-center gap-1 text-[#ff5e5e] text-sm">
          <span className="w-2 h-2 rounded-full bg-[#ff5e5e]" />
          Returned
        </span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <OrderTabs />

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e7e7e]" />
          <Input
            placeholder="Item name/ Order Id/ Tracking No."
            className="pl-10 bg-[#1a1a1a] border-[#212121] text-white placeholder:text-[#7e7e7e]"
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_250px] gap-6">
        <div className="space-y-6">
          {/* Order Info Card */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <div className="text-[#7e7e7e] mb-1">Order ID:</div>
                <div className="text-white font-medium">{orderId}</div>
              </div>
              <div>
                <div className="text-[#7e7e7e] mb-1">No of items:</div>
                <div className="text-white font-medium">3 Items</div>
              </div>
              <div>
                <div className="text-[#7e7e7e] mb-1">Delivered:</div>
                <div className="text-white font-medium">23rd October, 2025</div>
              </div>
              <div>
                <div className="text-[#7e7e7e] mb-1">Returned:</div>
                <div className="text-[#ff5e5e] font-medium">23rd October, 2025</div>
              </div>
              <div className="col-span-2">
                <div className="text-[#7e7e7e] mb-1">Shipped to:</div>
                <div className="text-white">
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                  ullamco.
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            {[1, 2, 3].map((item, index) => (
              <div key={item} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#212121]">
                <div className="flex gap-4">
                  <img
                    src="/Frame 2087327087.svg"
                    alt="B/W Wrangler"
                    className="w-20 h-24 object-cover rounded bg-[#212121]"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">B/W Wrangler</h3>
                    <p className="text-[#7e7e7e] text-sm mb-3">Order Number</p>
                    {index === 0 ? (
                      <span className="inline-block px-3 py-1 bg-[#ff5e5e]/10 text-[#ff5e5e] text-xs rounded">
                        Returned 30-09-2025
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-[#008c00]/10 text-[#008c00] text-xs rounded">
                        Delivered 04-09-2025
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium mb-1">NGN 30,000</div>
                    <div className="text-[#7e7e7e] text-sm">X 3</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Details */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
            <h2 className="text-white text-lg font-semibold mb-4">Payment Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7e7e7e]">Subtotal</span>
                <span className="text-white">NGN 30,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7e7e7e]">Discount</span>
                <span className="text-white">NGN 0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7e7e7e]">Shipping fees</span>
                <span className="text-white">NGN 1500.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#212121]">
                <span className="text-white font-medium">Total amount</span>
                <span className="text-white font-medium">NGN 31,500.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-[#8451e1] hover:bg-[#7041c7] text-white">Track Order</Button>
          <Button variant="outline" className="w-full bg-[#2a2a2a] border-[#2a2a2a] text-white hover:bg-[#3a3a3a]">
            Leave a Review
          </Button>
          <Button variant="outline" className="w-full bg-[#2a2a2a] border-[#2a2a2a] text-white hover:bg-[#3a3a3a]">
            Return or Refund
          </Button>
        </div>
      </div>
    </div>
  )
}


