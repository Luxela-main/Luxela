"use client"

import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check, Trash2 } from "lucide-react"
import { useState } from "react"

export default function NotificationsPage() {
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const notifications = [
    {
      title: "Title of notification",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      title: "Title of notification",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      title: "Title of notification",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      title: "Title of notification",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      title: "Title of notification",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
  ]

  return (
    <div>

      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-2xl font-semibold">Notifications</h1>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-[#7e7e7e] hover:text-white hover:bg-transparent text-sm flex items-center gap-2"
          >
            Mark all as read
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-[#ff5e5e] hover:text-[#ff5e5e] hover:bg-transparent text-sm flex items-center gap-2"
          >
            Delete all
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification, index) => (
          <div key={index} className="bg-[#1a1a1a] rounded-lg border border-[#212121]">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-2">{notification.title}</h3>
                  <p className="text-[#7e7e7e] text-sm leading-relaxed">{notification.content}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(index)}
                    className="text-[#7e7e7e] hover:text-white transition-colors"
                  >
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${expandedItems.includes(index) ? "rotate-180" : ""}`}
                    />
                  </button>
                  <button className="text-[#7e7e7e] hover:text-white transition-colors">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
