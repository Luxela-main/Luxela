"use client";

import { useState } from "react";
import { Bell, Search, Star, Trash } from "lucide-react";
import SearchBar from "@/components/search-bar";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
  useToggleNotificationStar,
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

  console.log("Notifications:", notifications);

  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const toggleStarMutation = useToggleNotificationStar();

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

  const toggleStar = (id: string) => {
    toggleStarMutation.mutate(id);
  };

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((notification: any) => notification.isStarred);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notification</h1>
          <p className="text-gray-400 mt-1">See all notification</p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
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
              onClick={() => setActiveTab("All")}>
              <span>All</span>
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n: any) => !n.isRead).length}
              </span>
            </button>
            <button
              className={`flex items-center ${
                activeTab === "Starred" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("Starred")}>
              <span>Starred</span>
              <span className="ml-1 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n: any) => n.isStarred).length}
              </span>
            </button>
          </div>
          <div className="flex space-x-4">
            <button
              className="flex items-center text-gray-400 hover:text-white"
              onClick={markAllAsRead}>
              <span>Mark all as read</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2">
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
              className="flex items-center text-red-500 hover:text-red-400"
              onClick={() => {}}>
              <span>Delete all</span>
              <Trash className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>

        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification: any) => (
            <div
              key={notification.id}
              className="flex items-center p-4 border-b border-[#333] hover:bg-[#222]">
              <div className="flex items-center w-full">
                <div
                  className={`w-2 h-2 rounded-full mr-3 ${
                    notification.isRead ? "bg-transparent" : "bg-blue-500"
                  }`}></div>
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <button
                  className={`mr-3 ${
                    notification.isStarred ? "text-yellow-500" : "text-gray-500"
                  }`}
                  onClick={() => toggleStar(notification.id)}>
                  <Star className="h-4 w-4" />
                </button>
                <span
                  className={`${
                    notification.isRead ? "text-gray-400" : "text-white"
                  }`}>
                  {notification.message}
                </span>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-400">
            No notifications found
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="text-gray-400">Result 1 - 10 of 20</div>
        <div className="flex space-x-2">
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Previous</span>
          </button>
          <button className="bg-purple-600 text-white px-3 py-1 rounded-md">
            1
          </button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">
            2
          </button>
          <button className="text-gray-400 px-3 py-1">...</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">
            4
          </button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Next</span>
          </button>
        </div>
      </div>
    </div>
  );
}
