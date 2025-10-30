import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="text-[#7e7e7e] hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? "text-white" : "text-[#7e7e7e]"}>{item.label}</span>
          )}
          {index < items.length - 1 && <ChevronRight className="w-4 h-4 text-[#7e7e7e]" />}
        </div>
      ))}
    </div>
  )
}
