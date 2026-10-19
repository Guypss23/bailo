import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import {
  listDueOverviews,
  listLeases,
  listTenants,
  listProperties,
  listPayments,
} from "@/lib/data"
import {
  generatePaymentsCsv,
  generatePropertiesSummaryCsv,
  generateAnnualExcelWorkbook,
} from "@/lib/domain/accounting-exports"

import { z } from "zod"

export const runtime = "nodejs"

const exportTypeSchema = z.enum(["payments_csv", "properties_csv", "annual_excel"])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { user, profile } = await requireUser()
    const rawParams = await params
    const parsedType = exportTypeSchema.safeParse(rawParams.type)
    if (!parsedType.success) {
      return new NextResponse("Type d'export invalide", { status: 400 })
    }
    const type = parsedType.data
    const searchParams = request.nextUrl.searchParams

    const currentYear = new Date().getFullYear()
    const yearParam = searchParams.get("annee")
    const year = yearParam ? parseInt(yearParam, 10) || currentYear : currentYear

    // Récupérer toutes les données de l'utilisateur connecté via la couche src/lib/data
    const [dues, leases, tenants, properties, payments] = await Promise.all([
      listDueOverviews(user.id, { year: String(year) }),
      listLeases(user.id),
      listTenants(user.id),
      listProperties(user.id),
      listPayments(user.id),
    ])

    const options = {
      year,
      payments,
      dues,
      leases,
      tenants,
      properties,
      currency: profile.currency || "XAF",
    }

    if (type === "payments_csv") {
      const csv = generatePaymentsCsv(options)
      const filename = `Paiements-${year}.csv`

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      })
    }

    if (type === "properties_csv") {
      const csv = generatePropertiesSummaryCsv(options)
      const filename = `Recapitulatif-biens-${year}.csv`

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      })
    }

    if (type === "annual_excel") {
      const buffer = await generateAnnualExcelWorkbook(options)
      const filename = `Bailo-Comptabilite-${year}.xlsx`

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      })
    }

    return new NextResponse("Type d'export non reconnu", { status: 404 })
  } catch (error) {
    console.error("Erreur lors de la génération de l'export comptable:", error)
    return new NextResponse("Erreur interne lors de la génération de l'export", {
      status: 500,
    })
  }
}
