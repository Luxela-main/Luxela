'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import { Clock, CheckCircle, Package, XCircle, Truck, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'delivered' | 'canceled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const { data: ordersData } = trpc.buyer.getPurchaseHistory.useQuery({}, {
    retry: 1,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (ordersData) {
      setOrders(ordersData.data);
      setIsLoading(false);
    }
  }, [ordersData]);

  useEffect(() => {
    let filtered = orders;

    if (filter === 'ongoing') {
      filtered = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status?.toLowerCase()));
    } else if (filter === 'delivered') {
      filtered = orders.filter(o => o.status?.toLowerCase() === 'delivered');
    } else if (filter === 'canceled') {
      filtered = orders.filter(o => o.status?.toLowerCase() === 'canceled');
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, filter]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return <CheckCircle className="text-green-500" size={20} />;
    if (s === 'canceled') return <XCircle className="text-red-500" size={20} />;
    if (s === 'shipped') return <Truck className="text-blue-500" size={20} />;
    return <Clock className="text-yellow-500" size={20} />;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'text-green-400';
    if (s === 'canceled') return 'text-red-400';
    if (s === 'shipped') return 'text-blue-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/buyer/dashboard' },
          { label: 'Orders' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">My Orders</h1>

          <div className="flex gap-3 mb-6 flex-wrap">
            {(['all', 'ongoing', 'delivered', 'canceled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded cursor-pointer transition text-sm font-medium ${
                  filter === f
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Package className="text-[#8451e1]" size={32} />
            </div>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">No orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Start shopping to see your orders here</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              {paginatedOrders.map(order => (
                <div key={order.id} className="bg-[#1a1a1a] rounded-lg p-6 hover:bg-[#252525] transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">Order #{order.id.slice(0, 8)}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <button className="text-[#8451e1] hover:text-[#7043d8] cursor-pointer transition">
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Category</p>
                      <p className="text-white font-medium mt-1">{order.category || 'Fashion'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Amount</p>
                      <p className="text-[#8451e1] font-bold text-lg mt-1">
                        ${parseFloat(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Expected Delivery</p>
                      <p className="text-white font-medium mt-1">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <button className="text-[#8451e1] hover:text-[#7043d8] text-sm cursor-pointer transition">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded cursor-pointer transition ${
                      currentPage === i + 1
                        ? 'bg-[#8451e1] text-white'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#1a1a1a] text-white rounded cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}