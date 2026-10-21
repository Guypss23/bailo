"use client"

import * as React from "react"
import { Download, Smartphone, Share, PlusSquare, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt({
  variant = "button",
  className = "",
}: {
  variant?: "button" | "banner" | "card"
  className?: string
}) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(false)
  const [iosDialogOpen, setIosDialogOpen] = React.useState(false)
  const [bannerDismissed, setBannerDismissed] = React.useState(false)

  React.useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    setIsStandalone(isStandaloneMode)

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Listen for app installed
    const installedHandler = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
      toast.success("Application Bailo installée sur votre écran d'accueil !")
    }

    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isStandalone) {
      toast.info("Bailo est déjà installé sur votre appareil.")
      return
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setDeferredPrompt(null)
        setIsStandalone(true)
      }
    } else if (isIOS) {
      setIosDialogOpen(true)
    } else {
      // General instructions for desktop/mobile browsers without prompt event
      toast.info(
        "Pour installer Bailo : ouvrez le menu de votre navigateur (3 points) et cliquez sur « Installer l'application »."
      )
    }
  }

  // If already standalone (opened from home screen icon), show badge or don't show prompt
  if (isStandalone) {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-2 text-xs text-[#1F5C45] dark:text-[#6FCB9F] font-medium bg-[#1F5C45]/10 p-3 rounded-lg border border-[#1F5C45]/20">
          <Check className="w-4 h-4 shrink-0" />
          <span>Application installée sur cet appareil (Mode Natif PWA actif).</span>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* Variant: Button (e.g. for menu or settings) */}
      {variant === "button" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleInstallClick}
          className={`gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-500/10 ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Installer l&apos;application mobile
        </Button>
      )}

      {/* Variant: Card (for settings page) */}
      {variant === "card" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Smartphone className="w-4 h-4 text-[#1F5C45] dark:text-[#6FCB9F]" />
              Installer Bailo sur votre smartphone
            </h4>
            <p className="text-xs text-muted-foreground">
              Accédez à vos loyers en 1 clic depuis votre écran d&apos;accueil (iPhone & Android), sans barre d&apos;adresse.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleInstallClick}
            className="bg-[#1F5C45] hover:bg-[#184936] text-white text-xs gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Installer sur ce téléphone
          </Button>
        </div>
      )}

      {/* Variant: Banner (e.g. for bottom of mobile drawer) */}
      {variant === "banner" && !bannerDismissed && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Installez Bailo sur votre écran d&apos;accueil</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleInstallClick}
              className="h-7 text-[11px] px-2.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold"
            >
              Installer
            </Button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-emerald-300/60 hover:text-white p-1"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Instruction Dialog */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-[#1F5C45] dark:text-[#6FCB9F] flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-base font-bold">
              Installer Bailo sur votre iPhone
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Suivez ces 2 étapes simples depuis Safari pour ajouter Bailo sur votre écran d&apos;accueil :
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {/* Étape 1 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="w-6 h-6 rounded-full bg-[#1F5C45] text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  Appuyez sur Partager
                  <Share className="w-3.5 h-3.5 text-blue-500 inline" />
                </p>
                <p className="text-muted-foreground text-[11px]">
                  En bas de l&apos;écran de votre navigateur Safari.
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="w-6 h-6 rounded-full bg-[#1F5C45] text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  « Sur l&apos;écran d&apos;accueil »
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-500 inline" />
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Faites défiler le menu vers le bas puis confirmez avec « Ajouter ».
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIosDialogOpen(false)}
            className="w-full mt-2 bg-[#1F5C45] hover:bg-[#184936] text-white text-xs"
          >
            J&apos;ai compris
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
