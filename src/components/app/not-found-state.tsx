import Link from "next/link"
import { FileQuestion, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotFoundStateProps {
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function NotFoundState({
  title = "Page ou élément non trouvé",
  description = "L'élément que vous recherchez n'existe pas ou a été déplacé.",
  backHref = "/tableau-de-bord",
  backLabel = "Retour au tableau de bord",
}: NotFoundStateProps) {
  return (
    <div className="min-h-[340px] flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border bg-card max-w-lg mx-auto my-12 shadow-xs">
      <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4">
        <FileQuestion className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
        {description}
      </p>
      <Button asChild variant="outline">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          {backLabel}
        </Link>
      </Button>
    </div>
  )
}
