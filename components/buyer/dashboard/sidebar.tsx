"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, ShoppingBag, Heart, Bell, Settings, LogOut, Menu, X, Package, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  activeItem?: string
}

export function Sidebar({ activeItem = "my-account" }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      toast({ title: "Success", description: "You have been successfully logged out." })
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong while logging out.", variant: "destructive" })
    } finally {
      setOpen(false)
    }
  }

  const derivedActive = (() => {
    if (!pathname) return activeItem
    if (pathname === "/dashboard") return "my-account"
    if (pathname.startsWith("/buyer/dashboard/orders")) return "orders"
    if (pathname.startsWith("/buyer/dashboard/favorite-items")) return "favorite-items"
    if (pathname.startsWith("/buyer/dashboard/notifications")) return "notifications"
    if (pathname.startsWith("/buyer/dashboard/returns")) return "returns"
    if (pathname.startsWith("/buyer/dashboard/help")) return "help"
    if (pathname.startsWith("/buyer/dashboard/settings")) return "settings"
    return activeItem
  })()

  const menuItems = [
    { id: "my-account", label: "My Account", icon: User, href: "/buyer/dashboard" },
    { id: "orders", label: "Orders", icon: ShoppingBag, href: "/buyer/dashboard/orders" },
    { id: "favorite-items", label: "Favorite Items", icon: Heart, href: "/buyer/dashboard/favorite-items" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/buyer/dashboard/notifications" },
    { id: "returns", label: "Returns & Refunds", icon: Package, href: "/buyer/dashboard/returns" },
    { id: "help", label: "Help Center", icon: HelpCircle, href: "/buyer/dashboard/help" },
    { id: "settings", label: "Settings", icon: Settings, href: "/buyer/dashboard/settings" },
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
          className="bg-[#1a1a1a] text-white hover:bg-[#222] cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 cursor-pointer"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-[#0e0e0e] border-r border-[#212121] min-h-screen flex flex-col transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "fixed lg:relative top-0 left-0 z-40 w-[280px] lg:translate-x-0 lg:w-[240px]"
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
                    "w-full justify-start gap-3 text-[14px] mb-3 text-[#acacac] hover:text-white hover:bg-[#1a1a1a] cursor-pointer",
                    isActive && "bg-[#8451E126] text-[14px] text-[#8451E1] hover:bg-[#8451e1] hover:text-white"
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
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogOverlay />
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-[#ff5e5e] hover:text-[#ff5e5e] hover:bg-[#1a1a1a] cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-[#0E0E0E] border border-[#2B2B2B] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Are you sure you want to log out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-[#141414] text-white border border-[#2B2B2B] hover:bg-[#1a1a1a] cursor-pointer">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                >
                  Log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>
    </>
  )
}