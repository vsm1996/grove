"use client"

import Link from "next/link"

interface Props {
  backHref: string
  backLabel?: string
  title: React.ReactNode
  subtitle?: string
  actions?: React.ReactNode
  maxWidth?: "2xl" | "4xl" | "6xl"
}

export function PageHeader({
  backHref,
  backLabel = "Back",
  title,
  subtitle,
  actions,
  maxWidth = "2xl",
}: Props) {
  return (
    <header className="border-b border-base-300 sticky top-0 z-40 bg-base-100/90 backdrop-blur-sm">
      <div className={`max-w-${maxWidth} mx-auto px-4 py-3 flex items-center gap-3`}>
        <Link href={backHref} className="btn btn-sm btn-ghost shrink-0">
          ← {backLabel}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <p className="text-xs opacity-50 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
