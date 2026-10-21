"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  CalendarRange,
  FileText,
  Building2,
  Users,
  Wallet,
  Settings,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { signOutAction } from "@/app/(auth)/actions"
import { useTheme } from "next-themes"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { PwaInstallPrompt } from "./pwa-install-prompt"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  userName?: string
  userEmail?: string
  isAdmin?: boolean
}

export function MobileNav({
  userName = "Propriétaire Bailo",
  userEmail = "proprietaire@example.com",
  isAdmin = false,
}: MobileNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isLoggingOut, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()

  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PB"

  const isItemActive = (href: string, exact: boolean = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const BOTTOM_ITEMS = [
    { title: "Accueil", href: "/tableau-de-bord", icon: LayoutDashboard, exact: true },
    { title: "Loyers", href: "/loyers", icon: Receipt, exact: true },
    { title: "Annuel", href: "/loyers/annuel", icon: CalendarRange, exact: false },
    { title: "Baux", href: "/baux", icon: FileText, exact: false },
  ]

  const MORE_ITEMS = [
    { title: "Dépenses & Travaux", href: "/depenses", icon: Wallet },
    { title: "Biens", href: "/biens", icon: Building2 },
    { title: "Locataires", href: "/locataires", icon: Users },
    { title: "Paramètres", href: "/parametres", icon: Settings },
  ]

  const isMoreActive = MORE_ITEMS.some((i) => pathname.startsWith(i.href))

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-[#07130E] text-white border-b border-[#152E22] shadow-md">
        <Link href="/tableau-de-bord" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
            B
          </div>
          <span className="font-semibold text-base text-white tracking-tight">
            Bailo
          </span>
        </Link>

        {/* Animated Hamburger Trigger conforming to user rules */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 relative focus:outline-none -mr-2 text-emerald-300"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileMenuOpen}
        >
          <div className="block w-6 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${
                mobileMenuOpen ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </div>
        </button>
      </header>

      {/* Mobile Bottom Bar (5 entries: Accueil, Loyers, Annuel, Baux, Plus) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07130E]/95 backdrop-blur-md border-t border-[#152E22] flex items-center justify-around px-1 py-1 shadow-2xl"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 6px))" }}
        aria-label="Navigation mobile"
      >
        {BOTTOM_ITEMS.map((item) => {
          const active = isItemActive(item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors",
                active
                  ? "text-emerald-400 font-semibold"
                  : "text-emerald-300/60 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mb-0.5 transition-colors",
                  active ? "text-emerald-400" : "text-emerald-300/60"
                )}
              />
              <span>{item.title}</span>
            </Link>
          )
        })}

        {/* 5th Entry: Plus with animated hamburger trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors",
            isMoreActive
              ? "text-emerald-400 font-semibold"
              : "text-emerald-300/60 hover:text-white"
          )}
          aria-label="Plus d'options"
        >
          <div className="w-5 h-5 relative mb-0.5 text-current">
            <span className="block absolute h-0.5 w-4 top-1 left-0.5 bg-current" />
            <span className="block absolute h-0.5 w-4 top-2.5 left-0.5 bg-current" />
            <span className="block absolute h-0.5 w-4 top-4 left-0.5 bg-current" />
          </div>
          <span>Plus</span>
        </button>
      </nav>

      {/* Sheet menu for "Plus" */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 pb-8 pt-4 bg-[#091510] text-emerald-100 border-t border-[#152E22]">
          <SheetHeader className="text-left pb-3 border-b border-white/10">
            <SheetTitle className="text-base font-semibold text-white">Menu Bailo</SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/60 px-2 py-1">
                Gestion
              </p>
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-white/15 text-white font-semibold shadow-xs"
                        : "text-emerald-300/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", active ? "text-emerald-400" : "text-emerald-300/70")} />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>

            {isAdmin && (
              <>
                <Separator className="bg-white/10" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/60 px-2 py-1">
                    Supervision
                  </p>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-white/15 text-white font-semibold shadow-xs"
                        : "text-emerald-300/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <ShieldCheck className={cn("w-4 h-4", pathname.startsWith("/admin") ? "text-emerald-400" : "text-emerald-300/70")} />
                    <span>Administration</span>
                  </Link>
                </div>
              </>
            )}

            <Separator className="bg-white/10" />

            {/* PWA Install Banner */}
            <div className="px-1">
              <PwaInstallPrompt variant="banner" />
            </div>

            {/* Profile & Theme */}
            <div className="space-y-3 px-2">
              <div className="flex items-center gap-3 py-1">
                <Avatar className="h-9 w-9 rounded-full border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Theme selector */}
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Thème</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border text-muted-foreground transition-colors",
                      theme === "light"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Clair
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border text-muted-foreground transition-colors",
                      theme === "dark"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Sombre
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border text-muted-foreground transition-colors",
                      theme === "system"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    Auto
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button
                disabled={isLoggingOut}
                onClick={() => {
                  setMobileMenuOpen(false)
                  startTransition(async () => {
                    await signOutAction()
                  })
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors mt-4 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>{isLoggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
