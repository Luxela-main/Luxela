import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 text-gray-400">{icon}</div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-center max-w-md">{description}</p>
    </div>
  )
}
