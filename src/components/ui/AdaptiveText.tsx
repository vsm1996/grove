"use client"

import { useCapacityContext } from "@/lib/capacity"

interface Props {
  positive: string
  neutral: string
  negative: string
  className?: string
}

/**
 * Renders different copy based on emotional valence.
 * positive > 0.2, negative < -0.2, else neutral.
 */
export function AdaptiveText({ positive, neutral, negative, className }: Props) {
  const { context } = useCapacityContext()
  const valence = context.emotionalState.valence

  const text = valence > 0.2 ? positive : valence < -0.2 ? negative : neutral
  return <span className={className}>{text}</span>
}
