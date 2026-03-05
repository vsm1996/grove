"use client"

import { useDerivedMode, deriveModeLabel } from "@/lib/capacity"
import type { InterfaceModeLabel } from "@/lib/capacity"

interface Props {
  showIn: InterfaceModeLabel[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Renders children only when the current mode label is in the allowlist.
 */
export function CapacityGate({ showIn, children, fallback = null }: Props) {
  const { field } = useDerivedMode()
  const label = deriveModeLabel(field)
  if (!showIn.includes(label)) return <>{fallback}</>
  return <>{children}</>
}
