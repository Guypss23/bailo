"use client"

import * as React from "react"
import { useState, useRef, useTransition } from "react"
import { toast } from "sonner"
import {
  PenTool,
  Upload,
  Trash2,
  RotateCcw,
  Check,
  Loader2,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  saveSignatureAction,
  deleteSignatureAction,
} from "@/app/(app)/parametres/actions"

export interface SignaturePadProps {
  initialSignaturePath?: string | null
}

export function SignaturePad({ initialSignaturePath }: SignaturePadProps) {
  const [signaturePath, setSignaturePath] = useState<string | null>(
    initialSignaturePath ?? null
  )
  const [mode, setMode] = useState<"draw" | "upload">("draw")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const sigCanvas = useRef<SignatureCanvas | null>(null)

  const handleClearDrawing = () => {
    sigCanvas.current?.clear()
  }

  const handleSaveDrawing = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error("Veuillez d'abord dessiner votre signature.")
      return
    }

    // Get trimmed base64 PNG
    const trimmedCanvas = sigCanvas.current.getTrimmedCanvas()
    const dataUrl = trimmedCanvas.toDataURL("image/png")

    const formData = new FormData()
    formData.append("dataUrl", dataUrl)

    startTransition(async () => {
      try {
        const res = await saveSignatureAction(formData)
        if (res.ok && res.signaturePath) {
          setSignaturePath(res.signaturePath)
          sigCanvas.current?.clear()
          toast.success("Signature enregistrée avec succès !")
        } else {
          toast.error(res.error || "Impossible d'enregistrer la signature.")
        }
      } catch {
        toast.error("Une erreur est survenue lors de l'enregistrement.")
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. La taille maximale est de 1 Mo.")
      return
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast.error("Seuls les formats PNG et JPEG sont acceptés.")
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadFile = () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une image de signature.")
      return
    }

    const formData = new FormData()
    formData.append("file", selectedFile)

    startTransition(async () => {
      try {
        const res = await saveSignatureAction(formData)
        if (res.ok && res.signaturePath) {
          setSignaturePath(res.signaturePath)
          setSelectedFile(null)
          setFilePreview(null)
          toast.success("Signature téléversée avec succès !")
        } else {
          toast.error(res.error || "Impossible d'enregistrer la signature.")
        }
      } catch {
        toast.error("Une erreur est survenue lors de l'envoi.")
      }
    })
  }

  const handleDeleteSignature = () => {
    startTransition(async () => {
      try {
        const res = await deleteSignatureAction()
        if (res.ok) {
          setSignaturePath(null)
          setSelectedFile(null)
          setFilePreview(null)
          toast.success("Signature supprimée.")
        } else {
          toast.error(res.error || "Impossible de supprimer la signature.")
        }
      } catch {
        toast.error("Une erreur est survenue lors de la suppression.")
      }
    })
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Signature du bailleur
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Cette signature sera apposée au bas de vos quittances de loyer et reçus officiels.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Existing signature view */}
        {signaturePath && (
          <div className="p-4 rounded-[10px] border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-primary" />
                Signature actuellement enregistrée
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDeleteSignature}
                disabled={isPending}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Supprimer
              </Button>
            </div>
            <div className="h-28 bg-white rounded-md border border-border flex items-center justify-center p-2 overflow-hidden">
              {/* Load through private API route with cache-busting timestamp */}
              <img
                src={`/api/files/signature.png?t=${Date.now()}`}
                alt="Signature enregistrée"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Vous pouvez la remplacer à tout moment en dessinant ou en important une nouvelle image ci-dessous.
            </p>
          </div>
        )}

        {/* Toggle mode */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Button
              type="button"
              variant={mode === "draw" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("draw")}
              className="text-xs h-8 font-medium"
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5" />
              Dessiner à l&apos;écran
            </Button>
            <Button
              type="button"
              variant={mode === "upload" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode("upload")}
              className="text-xs h-8 font-medium"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Importer un fichier (PNG, JPEG)
            </Button>
          </div>

          {mode === "draw" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Signez dans l&apos;encadré ci-dessous à l&apos;aide de votre souris ou de votre doigt sur écran tactile.
              </p>
              <div className="border border-border rounded-[10px] bg-white overflow-hidden shadow-2xs">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="#17201B"
                  canvasProps={{
                    className: "w-full h-44 cursor-crosshair",
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearDrawing}
                  disabled={isPending}
                  className="text-xs h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Effacer
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDrawing}
                  disabled={isPending}
                  className="text-xs h-8 font-medium"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Enregistrer le tracé
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Sélectionnez une image nette de votre signature sur fond transparent ou blanc (PNG ou JPEG, max 1 Mo).
              </p>

              <div className="border-2 border-dashed border-border rounded-[10px] p-6 text-center hover:border-primary/50 transition-colors bg-secondary/20">
                <input
                  type="file"
                  id="signature-file-upload"
                  accept="image/png,image/jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="signature-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary hover:underline">
                      Cliquez pour choisir un fichier
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      PNG ou JPEG jusqu&apos;à 1 Mo
                    </p>
                  </div>
                </label>
              </div>

              {filePreview && (
                <div className="p-3 border border-border rounded-[10px] bg-card space-y-2">
                  <span className="text-xs font-medium text-foreground block">
                    Aperçu avant enregistrement :
                  </span>
                  <div className="h-28 bg-white rounded border border-border flex items-center justify-center p-2">
                    <img
                      src={filePreview}
                      alt="Aperçu import"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadFile}
                      disabled={isPending}
                      className="text-xs h-8"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Téléversement...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Enregistrer cette image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
