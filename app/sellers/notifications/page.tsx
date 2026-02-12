"use client";

import { useState, useMemo } from "react";
import {
  Bell,
  Star,
  Trash2,
  AlertCircle,
  CheckCheck,
  Filter,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import {
  useUnifiedNotifications,
  useMarkAllNotificationsAsRead,
  useToggleNotificationStar,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/modules/sellers";
import { useRealtimeSellerNotifications } from "@/hooks/useRealtimeSellerNotifications";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ErrorState } from "@/components/sellers/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TabType = "All" | "Starred" | "Unread";
type SortType = "newest" | "oldest";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useUnifiedNotifications();

  
  useRealtimeSellerNotifications();

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const toggleStarMutation = useToggleNotificationStar();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

  
  const notificationTypes = useMemo(() => {
    return [...new Set(notifications.map((n: any) => n.type))].sort();
  }, [notifications]);

  
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    
    if (activeTab === "Starred") {
      result = result.filter((n: any) => n.isStarred);
    } else if (activeTab === "Unread") {
      result = result.filter((n: any) => !n.isRead);
    }

    
    if (filterType) {
      result = result.filter((n: any) => n.type === filterType);
    }

    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (n: any) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search)
      );
    }

    
    const sorted = [...result];
    sorted.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    return sorted;
  }, [notifications, activeTab, filterType, searchTerm, sortBy]);

  const unreadCount = useMemo(
    () => notifications.filter((n: any) => !n.isRead).length,
    [notifications]
  );
  const starredCount = useMemo(
    () => notifications.filter((n: any) => n.isStarred).length,
    [notifications]
  );

  if (isLoading) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load notifications. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "shipment_due":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "dispute_alert":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "ticket_reply":
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      order_pending: "New Order",
      shipment_due: "Ship Order",
      dispute_alert: "Dispute",
      ticket_reply: "Support",
      system_alert: "System",
      review_request: "Review",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "order_pending":
        return "bg-yellow-100 text-yellow-800";
      case "shipment_due":
        return "bg-orange-100 text-orange-800";
      case "dispute_alert":
        return "bg-red-100 text-red-800";
      case "ticket_reply":
        return "bg-purple-500/10 text-purple-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleMarkAsRead = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate({ notificationId });
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {}
      <div className="sticky top-16 z-30 bg-[#0E0E0E] border-b border-[#2B2B2B]">
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Bell className="w-8 h-8 text-purple-500" />
                  Notifications
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  {filteredNotifications.length} notification
                  {filteredNotifications.length !== 1 ? "s" : ""}
                </p>
              </div>

              {}
              <div className="hidden md:flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAllMutation.mutate()}
                    disabled={deleteAllMutation.isPending}
                    className="cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          {}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="w-full lg:w-auto px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm hover:bg-[#222] transition-colors flex items-center gap-2 justify-center lg:justify-start cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Filter
              {filterType && (
                <X
                  className="w-4 h-4 ml-1 cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setFilterType(null);
                  }}
                />
              )}
            </button>

            {}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-40">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setFilterType(null);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm rounded cursor-pointer ${
                      !filterType
                        ? "bg-purple-600 text-white"
                        : "hover:bg-[#222] text-gray-300"
                    }`}
                  >
                    All Types
                  </button>
                  {notificationTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm rounded cursor-pointer ${
                        filterType === type
                          ? "bg-purple-600 text-white"
                          : "hover:bg-[#222] text-gray-300"
                      }`}
                    >
                      {getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#2B2B2B] pb-4">
          {(["All", "Unread", "Starred"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "bg-[#1a1a1a] text-gray-300 hover:bg-[#222]"
              }`}
            >
              {tab}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
              {tab === "Starred" && starredCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">
                  {starredCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.isRead
                    ? "bg-[#1a1a1a] border-[#333]"
                    : "bg-[#1a1a1a] border-purple-500/30 shadow-lg shadow-purple-500/10"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-white">
                          {notification.title}
                        </h3>
                        <p className="text-gray-300 text-sm mt-1">
                          {notification.message}
                        </p>
                      </div>

                      {}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2 sm:mt-1" />
                      )}
                    </div>

                    {}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getTypeBadgeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="flex-shrink-0 flex gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() =>
                        handleMarkAsRead(
                          notification.id,
                          notification.isRead
                        )
                      }
                      className="p-2 hover:bg-[#222] rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
                      title={
                        notification.isRead
                          ? "Already read"
                          : "Mark as read"
                      }
                    >
                      {notification.isRead ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <CheckCheck className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() =>
                        toggleStarMutation.mutate({
                          notificationId: notification.id,
                          starred: !notification.isStarred,
                        })
                      }
                      className="p-2 hover:bg-[#222] rounded-lg transition-colors cursor-pointer"
                      title={
                        notification.isStarred ? "Unstar" : "Star"
                      }
                    >
                      <Star
                        className={`w-5 h-5 ${
                          notification.isStarred
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-400 hover:text-yellow-500"
                        }`}
                      />
                    </button>

                    <button
                      onClick={() =>
                        deleteNotificationMutation.mutate({
                          notificationId: notification.id,
                        })
                      }
                      disabled={deleteNotificationMutation.isPending}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {searchTerm || filterType
                ? "No notifications match your filters"
                : activeTab === "Starred"
                ? "No starred notifications"
                : activeTab === "Unread"
                ? "All caught up!"
                : "No notifications yet"}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || filterType
                ? "Try adjusting your search or filters"
                : activeTab === "Unread"
                ? "You have no unread notifications"
                : "Notifications about your orders, disputes, and support will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}