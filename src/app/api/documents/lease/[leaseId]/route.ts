import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { getLease, getProperty, getTenant } from "@/lib/data"
import { renderLeaseContractToBuffer } from "@/lib/pdf/lease-contract"

export const runtime = "nodejs"

const paramsSchema = z.object({
  leaseId: z.string().min(1, "Identifiant du bail manquant"),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ leaseId: string }> }
) {
  let auth
  try {
    auth = await requireUser()
  } catch {
    return new NextResponse("Non autorisé", { status: 401 })
  }

  const rawParams = await context.params
  const parsed = paramsSchema.safeParse(rawParams)
  if (!parsed.success) {
    return new NextResponse("Identifiant de bail invalide", { status: 400 })
  }

  const { leaseId } = parsed.data
  const { user, profile } = auth

  const lease = await getLease(user.id, leaseId)
  if (!lease) {
    return new NextResponse("Bail introuvable", { status: 404 })
  }

  const [property, tenant] = await Promise.all([
    getProperty(user.id, lease.property_id),
    getTenant(user.id, lease.tenant_id),
  ])

  if (!property || !tenant) {
    return new NextResponse("Bien ou locataire associé introuvable", { status: 404 })
  }

  try {
    const buffer = await renderLeaseContractToBuffer({
      lease,
      tenant,
      property,
      profile,
    })

    const safeTenantName = tenant.last_name.replace(/[^a-zA-Z0-9_-]/g, "_")
    const filename = `Contrat_Bail_${safeTenantName}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (err: any) {
    console.error("Error generating lease contract PDF:", err)
    return new NextResponse("Erreur lors de la génération du contrat de bail", {
      status: 500,
    })
  }
}
