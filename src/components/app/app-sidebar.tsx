"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  CalendarRange,
  Building2,
  Users,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "@/components/app/user-menu"
import { cn } from "@/lib/utils"

const MAIN_NAV_ITEMS = [
  {
    title: "Tableau de bord",
    href: "/tableau-de-bord",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Loyers du mois",
    href: "/loyers",
    icon: Receipt,
    exact: true,
  },
  {
    title: "Suivi annuel",
    href: "/loyers/annuel",
    icon: CalendarRange,
    exact: false,
  },
  {
    title: "Biens",
    href: "/biens",
    icon: Building2,
    exact: false,
  },
  {
    title: "Locataires",
    href: "/locataires",
    icon: Users,
    exact: false,
  },
  {
    title: "Baux",
    href: "/baux",
    icon: FileText,
    exact: false,
  },
]

const SECONDARY_NAV_ITEMS = [
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
    exact: false,
  },
]

interface AppSidebarProps {
  userName?: string
  userEmail?: string
}

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname()

  const isItemActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 border-r border-[#152E22] bg-[#07130E] text-emerald-100 select-none transition-all duration-200 z-30
        md:w-16 lg:w-[248px] fixed inset-y-0 left-0 shadow-xl"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-white/10">
        <Link
          href="/tableau-de-bord"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-base tracking-tighter shrink-0 shadow-xs">
            B
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-semibold text-lg text-white tracking-tight leading-tight">
              Bailo
            </span>
            <span className="text-[10px] text-emerald-300/70 font-medium">
              Gestion locative GA
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-2 lg:px-3 overflow-y-auto space-y-6">
        <nav className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href, item.exact)
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all",
                  active
                    ? "bg-white/15 text-white font-semibold shadow-xs"
                    : "text-emerald-300/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-emerald-300/70 group-hover:text-white"
                  )}
                />
                <span className="hidden lg:inline-block truncate">
                  {item.title}
                </span>
              </Link>
            )

            return (
              <div key={item.href}>
                {/* Desktop view */}
                <div className="hidden lg:block">{linkContent}</div>
                {/* Tablet view with Tooltip */}
                <div className="block lg:hidden">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex justify-center">{linkContent}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#091510] text-white border-emerald-900/40">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="px-2">
          <Separator className="bg-white/10" />
        </div>

        {/* Secondary Navigation */}
        <nav className="space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href, item.exact)
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all",
                  active
                    ? "bg-white/15 text-white font-semibold shadow-xs"
                    : "text-emerald-300/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-emerald-300/70 group-hover:text-white"
                  )}
                />
                <span className="hidden lg:inline-block truncate">
                  {item.title}
                </span>
              </Link>
            )

            return (
              <div key={item.href}>
                <div className="hidden lg:block">{linkContent}</div>
                <div className="block lg:hidden">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex justify-center">{linkContent}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#091510] text-white border-emerald-900/40">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </nav>

        {/* Local Security Status Badge */}
        <div className="hidden lg:block px-2 pt-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-emerald-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Stockage local .data/</span>
          </div>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-2 lg:p-3 border-t border-white/10 mt-auto">
        <div className="hidden lg:block">
          <UserMenu collapsed={false} userName={userName} userEmail={userEmail} />
        </div>
        <div className="block lg:hidden">
          <UserMenu collapsed={true} userName={userName} userEmail={userEmail} />
        </div>
      </div>
    </aside>
  )
}
