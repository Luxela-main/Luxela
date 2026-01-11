import { Search, Bell, ShoppingCart, ChevronDown } from "lucide-react";
import Logo from "@/public/luxela.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="bg-[#0e0e0e] border-b border-[#212121] px-[40px] py-[20px]">
      <div className="flex items-center justify-between">
        <Link href="/sellers/dashboard" className="flex ">
          <Image
            src={Logo}
            alt="LUXELA"
            width={196.02}
            height={32}
            className="mr-2"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white p-[10px] bg-[#141414] border border-[#212121] rounded-[4px] hover:bg-[#1a1a1a]"
          >
            <Search className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white p-[10px] bg-[#141414] border border-[#212121] rounded-[4px] hover:bg-[#1a1a1a]"
          >
            <Bell className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white p-[10px] bg-[#141414] border border-[#212121] rounded-[4px] hover:bg-[#1a1a1a]"
          >
            <ShoppingCart className="w-6 h-6" />
          </Button>

          <div className="flex items-center gap-2 ml-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-[#8451E126] text-[#8451E1] text-sm">
                JD
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm">jondoe64</span>
            <ChevronDown className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
