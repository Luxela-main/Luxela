"use client";

import { useState } from "react";
import { Bell, Star, Trash } from "lucide-react";
import SearchBar from "@/components/search-bar";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useToggleNotificationStar,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "@/modules/sellers";
import { LoadingState } from "@/components/sellers/LoadingState";
import { ErrorState } from "@/components/sellers/ErrorState";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useNotifications();

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const toggleStarMutation = useToggleNotificationStar();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

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

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const toggleStar = (notificationId: string) => {
    toggleStarMutation.mutate({ notificationId });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }
  };

  // Filter by search and tab
  const filteredNotifications = notifications
    .filter((notification: any) => {
      if (activeTab === "Starred" && !notification.isStarred) return false;
      if (search && !notification.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  return (
    <div className="px-6 mt-4 md:mt-0">
      <div className="mb-6">
        <div className="w-60 z-10 lg:w-80 max-lg:fixed max-md:right-10 max-lg:right-12 max-lg:top-[18px] lg:ml-auto">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>
      <div className="mb-6 md:max-lg:pt-10">
        <h1 className="text-2xl font-semibold">Notification</h1>
        <p className="text-gray-400 mt-1">See all notification</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#333] flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          <span className="font-medium">List Notification</span>
        </div>

        <div className="flex justify-between items-center p-4 border-b border-[#333]">
          <div className="flex space-x-4">
            <button
              className={`flex items-center ${
                activeTab === "All" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("All")}
            >
              <span>All</span>
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n: any) => !n.isRead).length}
              </span>
            </button>
            <button
              className={`flex items-center ${
                activeTab === "Starred" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("Starred")}
            >
              <span>Starred</span>
              <span className="ml-1 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n: any) => n.isStarred).length}
              </span>
            </button>
          </div>
          <div className="flex space-x-4">
            <button
              className="flex items-center text-gray-400 hover:text-white"
              onClick={markAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <span>Mark all as read</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => deleteAllMutation.mutate()}
              className="flex items-center text-red-500 hover:text-red-400"
            >
              <span>Delete all</span>
              <Trash className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification: any) => (
            <div
              key={notification.id}
              className="flex items-center p-4 border-b border-[#333] hover:bg-[#222] cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center w-full">
                <div
                  className={`w-2 h-2 rounded-full mr-3 ${
                    notification.isRead ? "bg-transparent" : "bg-blue-500"
                  }`}
                ></div>
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className={`mr-3 ${
                    notification.isStarred ? "text-yellow-500" : "text-gray-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(notification.id);
                  }}
                >
                  <Star className="h-4 w-4" fill={notification.isStarred ? "currentColor" : "none"} />
                </button>
                <span
                  className={`flex-1 ${
                    notification.isRead ? "text-gray-400" : "text-white"
                  }`}
                >
                  {notification.message}
                </span>
                <span className="text-sm text-gray-500 mr-3">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
                <button
                  className="text-red-500 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotificationMutation.mutate({ notificationId: notification.id });
                  }}
                  disabled={deleteNotificationMutation.isPending}
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            {activeTab === "Starred" 
              ? "No starred notifications" 
              : "You're all caught up! Keep selling notifications will appear here when something new happens."}
          </div>
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <div className="flex justify-between items-center mt-6 text-sm">
          <div className="text-gray-400">
            Showing {filteredNotifications.length} of {notifications.length}
          </div>
        </div>
      )}
    </div>
  );
}