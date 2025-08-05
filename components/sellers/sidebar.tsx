"use client"

import {
  LayoutGrid,
  PlusCircle,
  ShoppingCart,
  BarChart3,
  Bell,
  Clock,
  FileText,
  Headphones,
  Settings,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/public/luxela.svg"

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="w-[220px] min-h-screen bg-[#121212] border-r border-[#222] flex flex-col">
      <div className="p-6">
        <Link href="/sellers/dashboard" className="flex items-center">
          <Image src={Logo} alt="LUXELA" width={147.99} height={24.15} className="mr-2" />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          <li>
            <Link
              href="/sellers/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/dashboard") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"}`}
            >
              <LayoutGrid size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/new-listing"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/new-listing") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"}`}
            >
              <PlusCircle size={20} />
              <span>New listing</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/my-listings"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/my-listings") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"}`}
            >
              <ShoppingCart size={20} />
              <span>My listings</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/sales"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/sales") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"}`}
            >
              <BarChart3 size={20} />
              <span>Sales</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/notifications"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/notifications") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"} relative`}
            >
              <Bell size={20} />
              <span>Notifications</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                2
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/pending-orders"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/pending-orders") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"} relative`}
            >
              <Clock size={20} />
              <span>Pending orders</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                10
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/sellers/reports"
              className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive("/sellers/reports") ? "bg-[#1e1e1e]" : "hover:bg-[#1e1e1e]"}`}
            >
              <FileText size={20} />
              <span>Reports</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-auto px-4 py-6">
        <ul className="space-y-1">
          <li>
            <Link href="/sellers/support" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1e1e1e]">
              <Headphones size={20} />
              <span>Contact support</span>
            </Link>
          </li>
          <li>
            <Link href="/sellers/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#1e1e1e]">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>

        <div className="mt-6 flex items-center gap-3 px-3 py-2 border-t border-[#222] pt-4">
          <div className="relative">
            <Image
              src="/placeholder.svg?height=36&width=36"
              alt="User"
              width={36}
              height={36}
              className="rounded-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium">MomManor Daniel</p>
            <p className="text-xs text-gray-400">Seller</p>
          </div>
          <button className="ml-auto">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
