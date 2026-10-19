import "server-only"
import { isSupabaseConfigured } from "@/lib/supabase"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import {
  listDocumentsSupabase,
  getDocumentSupabase,
  getDocumentByRentDueSupabase,
  createDocumentSupabase,
  deleteDocumentSupabase,
} from "./supabase/documents"
import type { Document, NewDocument, DocumentKind } from "./types"

export async function listDocuments(
  ownerId: string,
  options: {
    leaseId?: string
    rentDueId?: string
    kind?: DocumentKind
  } = {}
): Promise<Document[]> {
  if (isSupabaseConfigured()) {
    return listDocumentsSupabase(ownerId, options)
  }
  const store = await readStore()
  const documents = store.documents ?? []
  return documents
    .filter((doc) => {
      if (doc.owner_id !== ownerId) return false
      if (options.leaseId && doc.lease_id !== options.leaseId) return false
      if (options.rentDueId && doc.rent_due_id !== options.rentDueId) return false
      if (options.kind && doc.kind !== options.kind) return false
      return true
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getDocument(
  ownerId: string,
  id: string
): Promise<Document | null> {
  if (isSupabaseConfigured()) {
    return getDocumentSupabase(ownerId, id)
  }
  const store = await readStore()
  const documents = store.documents ?? []
  const doc = documents.find((d) => d.id === id && d.owner_id === ownerId)
  return doc ?? null
}

export async function getDocumentByRentDue(
  ownerId: string,
  rentDueId: string,
  kind?: DocumentKind
): Promise<Document | null> {
  if (isSupabaseConfigured()) {
    return getDocumentByRentDueSupabase(ownerId, rentDueId, kind)
  }
  const store = await readStore()
  const documents = store.documents ?? []
  const doc = documents.find(
    (d) =>
      d.owner_id === ownerId &&
      d.rent_due_id === rentDueId &&
      (!kind || d.kind === kind)
  )
  return doc ?? null
}

export async function createDocument(
  ownerId: string,
  data: NewDocument
): Promise<Document> {
  if (isSupabaseConfigured()) {
    return createDocumentSupabase(ownerId, data)
  }
  return mutateStore((current) => {
    const documents = current.documents ?? []

    // If an identical document already exists for this rent_due and kind, replace it
    const existingIndex = documents.findIndex(
      (d) =>
        d.owner_id === ownerId &&
        d.rent_due_id === data.rent_due_id &&
        d.kind === data.kind
    )

    const newDoc: Document = {
      id: existingIndex !== -1 ? documents[existingIndex].id : generateUUID(),
      owner_id: ownerId,
      lease_id: data.lease_id,
      rent_due_id: data.rent_due_id,
      kind: data.kind,
      file_path: data.file_path,
      created_at: currentISO(),
    }

    let nextDocuments: Document[]
    if (existingIndex !== -1) {
      nextDocuments = [...documents]
      nextDocuments[existingIndex] = newDoc
    } else {
      nextDocuments = [...documents, newDoc]
    }

    return {
      nextData: {
        ...current,
        documents: nextDocuments,
      },
      result: newDoc,
    }
  })
}

export async function deleteDocument(
  ownerId: string,
  id: string
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    return deleteDocumentSupabase(ownerId, id)
  }
  return mutateStore((current) => {
    const documents = current.documents ?? []
    const doc = documents.find((d) => d.id === id && d.owner_id === ownerId)
    if (!doc) {
      return { nextData: current, result: false }
    }

    const nextDocuments = documents.filter((d) => d.id !== id)
    return {
      nextData: {
        ...current,
        documents: nextDocuments,
      },
      result: true,
    }
  })
}
