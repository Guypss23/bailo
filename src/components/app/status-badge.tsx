import * as React from "react"
import { cn } from "@/lib/utils"

export type DueStatus = "paye" | "partiel" | "impaye" | "a_venir"

const STATUS_CONFIG: Record<
  DueStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  paye: {
    label: "Payé",
    dotClass: "bg-[#1E8A5A] dark:bg-[#4CC38A]",
    badgeClass:
      "bg-[#DDF1E6] text-[#1E8A5A] dark:bg-[#173426] dark:text-[#4CC38A] border-[#1E8A5A]/20 dark:border-[#4CC38A]/30",
  },
  partiel: {
    label: "Partiel",
    dotClass: "bg-[#C98A0B] dark:bg-[#E3AA3B]",
    badgeClass:
      "bg-[#F8EBCB] text-[#9E6504] dark:bg-[#3A2C10] dark:text-[#E3AA3B] border-[#C98A0B]/20 dark:border-[#E3AA3B]/30",
  },
  impaye: {
    label: "Impayé",
    dotClass: "bg-[#C2413A] dark:bg-[#EC7068]",
    badgeClass:
      "bg-[#F7DEDB] text-[#C2413A] dark:bg-[#3D1C1A] dark:text-[#EC7068] border-[#C2413A]/20 dark:border-[#EC7068]/30",
  },
  a_venir: {
    label: "À venir",
    dotClass: "bg-[#8E9A94] dark:bg-[#7D8A84]",
    badgeClass:
      "bg-[#E9EDEA] text-[#5C6A62] dark:bg-[#1F2824] dark:text-[#93A39A] border-[#8E9A94]/20 dark:border-[#7D8A84]/30",
  },
}

interface StatusBadgeProps {
  status: DueStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({
  status,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.a_venir

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  )
}
