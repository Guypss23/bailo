import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { readFile } from "@/lib/data"

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
  json: "application/json",
  txt: "text/plain",
}

const pathParamsSchema = z.object({
  path: z.array(z.string().min(1)).min(1, "Chemin non spécifié"),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  let auth
  try {
    auth = await requireUser()
  } catch {
    return new NextResponse("Non autorisé", { status: 401 })
  }

  const rawParams = await context.params
  const parsed = pathParamsSchema.safeParse(rawParams)
  if (!parsed.success) {
    return new NextResponse("Chemin non spécifié", { status: 404 })
  }
  const pathSegments = parsed.data.path

  // If path explicitly starts with an ownerId segment, ensure it strictly matches the logged in user
  let relativePath = pathSegments.join("/")
  if (pathSegments[0] === auth.user.id) {
    relativePath = pathSegments.slice(1).join("/")
  } else if (pathSegments.length > 1 && pathSegments[0].includes("-")) {
    // Attempting to access another owner folder
    return new NextResponse("Fichier non trouvé", { status: 404 })
  }

  try {
    const fileBuffer = await readFile(auth.user.id, relativePath)
    if (!fileBuffer) {
      return new NextResponse("Fichier non trouvé", { status: 404 })
    }

    const extension = relativePath.split(".").pop()?.toLowerCase() || ""
    const contentType = MIME_TYPES[extension] || "application/octet-stream"

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Length": fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    return new NextResponse("Fichier non trouvé", { status: 404 })
  }
}
