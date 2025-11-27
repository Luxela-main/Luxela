import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

const PurchaseHistory = () => {
  const [activeTab, setActiveTab] = useState<'shipped' | 'cancelled'>('shipped');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders from backend based on active tab
  const { data: ordersData, isLoading } = trpc.buyer.getPurchaseHistory.useQuery({
    status: activeTab === 'shipped' ? 'ongoing' : 'canceled',
    page: 1,
    limit: 50,
  });

  // Transform backend data to match component structure
  const orders = ordersData?.data.map((order) => ({
    id: order.orderId,
    name: order.productTitle,
    type: order.productCategory,
    status: order.deliveryStatus === 'delivered' ? 'Delivered' :
            order.deliveryStatus === 'in_transit' ? 'Shipped' :
            order.orderStatus === 'canceled' ? 'Cancelled' : 'Processing',
    price: `${order.currency} ${(order.priceCents / 100).toFixed(2)}`,
    priceColor: order.deliveryStatus === 'delivered' ? 'text-green-400' :
                 order.deliveryStatus === 'in_transit' ? 'text-purple-400' :
                 order.orderStatus === 'canceled' ? 'text-red-400' : 'text-yellow-500',
    image: order.productImage,
  })) || [];

  // ✅ Filter based on search query
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      order.name.toLowerCase().includes(q) ||
      order.type.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q) ||
      order.price.toLowerCase().includes(q);

    return matchSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
  };

  return (
    <div className="w-full text-white">
      {/* Header Tabs */}
      <div className="md:flex items-center md:justify-between my-6 pb-6 border-b border-gray-800">
        <div className="flex gap-8">
          <motion.button
            onClick={() => setActiveTab('shipped')}
            className="relative pb-4 text-sm font-medium cursor-pointer"
            whileHover={{ y: -0.5 }}
          >
            <span
              className={
                activeTab === 'shipped'
                  ? 'text-purple-400'
                  : 'text-[#DCDCDC] hover:text-purple-400'
              }
            >
              Shipped / Delivered
            </span>
            {activeTab === 'shipped' && (
              <motion.div
                layoutId="purchaseTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('cancelled')}
            className="relative pb-4 text-sm font-medium cursor-pointer"
            whileHover={{ y: -0.5 }}
          >
            <span
              className={
                activeTab === 'cancelled'
                  ? 'text-purple-400'
                  : 'text-[#DCDCDC] hover:text-purple-400'
              }
            >
              Cancelled / Returned
            </span>
            {activeTab === 'cancelled' && (
              <motion.div
                layoutId="purchaseTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"
                transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        </div>

        {/* Search Input */}
        <motion.div
          className="relative max-w-64 w-full mt-5 md:mt-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            type="text"
            placeholder="Search order or order number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border border-gray-800 rounded-md px-4 py-2 pl-10 text-sm text-gray-400 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors w-full"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          Loading orders...
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              variants={itemVariants}
              whileHover={{ y: -1 }}
              className="group relative"
            >
              <motion.div className="p-3 bg-[#141414] rounded-[8px] border border-[#212121] flex items-center gap-4">
                {/* Product Image */}
                <motion.div
                  className="size-[120px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex-shrink-0 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-blue-900"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 2l-2 2v14l2 2h12l2-2V4l-2-2H6zm0 2h12v14H6V4zm2 2v10h8V6H8zm2 2h4v6h-4V8z" />
                    </svg>
                  </div>
                </motion.div>

                {/* Order Info */}
                <div className="flex-1 flex flex-col gap-5 justify-between min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <motion.h3 className="text-sm font-medium text-white mb-1">
                        {order.name}
                      </motion.h3>
                      <motion.p className="text-xs text-gray-400">
                        Order ID: #{order.id}
                      </motion.p>
                    </div>
                    <Link
                      href="#"
                      className="text-xs text-[#8451E1] bg-[#8451E133] rounded-full py-1 px-3 hover:text-purple-400 transition"
                    >
                      See More
                    </Link>
                  </div>

                  <motion.p
                    className={`text-xs font-medium ${order.priceColor} border rounded-full py-1 px-3 w-max`}
                  >
                    {order.price}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center py-16 text-gray-500"
          >
            {searchQuery ? `No orders found matching "${searchQuery}"` : 'No orders yet'}
          </motion.div>
        )}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default PurchaseHistory;
