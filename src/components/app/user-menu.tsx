"use client"

import * as React from "react"
import { useTransition } from "react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Sun, Moon, Laptop, LogOut, Check, Loader2, ShieldCheck } from "lucide-react"
import { signOutAction } from "@/app/(auth)/actions"
import { cn } from "@/lib/utils"

interface UserMenuProps {
  collapsed?: boolean
  userName?: string
  userEmail?: string
  isAdmin?: boolean
}

export function UserMenu({
  collapsed = false,
  userName = "Propriétaire Bailo",
  userEmail = "proprietaire@example.com",
  isAdmin = false,
}: UserMenuProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const initials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "PB"

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer",
          collapsed ? "justify-center" : "justify-between"
        )}
        aria-label="Menu utilisateur"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 rounded-full border border-white/20 shrink-0">
            <AvatarFallback className="bg-emerald-500 text-slate-950 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userName}
              </p>
              <p className="text-[11px] text-emerald-300/70 truncate">
                {userEmail}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? "center" : "end"}
        side="top"
        className="w-56"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-semibold text-foreground leading-none">{userName}</p>
            <p className="text-[11px] text-muted-foreground leading-none">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-1">
            Apparence
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme("light")} className="text-xs cursor-pointer">
            <Sun className="mr-2 h-4 w-4" />
            <span>Clair</span>
            {theme === "light" && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="text-xs cursor-pointer">
            <Moon className="mr-2 h-4 w-4" />
            <span>Sombre</span>
            {theme === "dark" && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="text-xs cursor-pointer">
            <Laptop className="mr-2 h-4 w-4" />
            <span>Système</span>
            {theme === "system" && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/admin")}
              className="text-xs cursor-pointer text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Zone Administration</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs text-destructive focus:text-destructive cursor-pointer"
          disabled={isPending}
          onClick={handleSignOut}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isPending ? "Déconnexion..." : "Se déconnecter"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
