"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ShoppingBag, Heart, Bell, Settings, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SidebarProps {
  activeItem?: string
}

export function Sidebar({ activeItem = "my-account" }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const derivedActive = (() => {
    if (!pathname) return activeItem
    if (pathname === "/dashboard") return "my-account"
    if (pathname.startsWith("/dashboard/orders")) return "orders"
    if (pathname.startsWith("/dashboard/favorite-items")) return "favorite-items"
    if (pathname.startsWith("/dashboard/notifications")) return "notifications"
    if (pathname.startsWith("/dashboard/settings")) return "settings"
    return activeItem
  })()

  const menuItems = [
    { id: "my-account", label: "My Account", icon: User, href: "/dashboard" },
    { id: "orders", label: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
    { id: "favorite-items", label: "Favorite Items", icon: Heart, href: "/dashboard/favorite-items" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-[#1a1a1a] text-white hover:bg-[#222]"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-[#0e0e0e] border-r border-[#212121] min-h-screen flex flex-col transition-transform duration-300 ease-in-out",
          // Mobile: Fixed position with slide-in animation
          "fixed lg:relative top-0 left-0 z-40 w-[280px]",
          // Hide on mobile by default, show when menu is open
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          // Always visible on desktop (lg and up)
          "lg:translate-x-0 lg:w-[240px]"
        )}
      >
        <nav className="flex-1 px-6 py-[31px] gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === derivedActive

            return (
              <Link key={item.id} href={item.href} onClick={closeMobileMenu}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-[14px] mb-3 text-[#acacac] hover:text-white hover:bg-[#1a1a1a]",
                    isActive && "bg-[#8451E126] text-[14px] text-[#8451E1] hover:bg-[#8451e1] hover:text-white",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-[#ff5e5e] hover:text-[#ff5e5e] hover:bg-[#1a1a1a]"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </Button>
        </div>
      </aside>
    </>
  )
}