"use client"

import * as React from "react"
import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  value: string
  label?: string
}

export function CopyButton({ value, label = "valeur" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copié dans le presse-papier`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Impossible de copier")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
      title={`Copier ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#1E8A5A]" />
          <span className="text-[11px] text-[#1E8A5A]">Copié</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span className="text-[11px]">Copier</span>
        </>
      )}
    </Button>
  )
}
