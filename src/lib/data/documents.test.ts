import { describe, it, expect, beforeEach } from "vitest"
import {
  createDocument,
  getDocument,
  getDocumentByRentDue,
  listDocuments,
  deleteDocument,
} from "./documents"

describe("src/lib/data/documents - Gestion des documents et quittances", () => {
  const ownerA = "owner-doc-a"
  const ownerB = "owner-doc-b"

  const lease1 = "lease-1"
  const lease2 = "lease-2"

  const due1 = "due-1"
  const due2 = "due-2"

  it("crée un document avec succès pour un propriétaire", async () => {
    const doc = await createDocument(ownerA, {
      lease_id: lease1,
      rent_due_id: due1,
      kind: "quittance",
      file_path: `${lease1}/2026-10-quittance.pdf`,
    })

    expect(doc.id).toBeDefined()
    expect(doc.owner_id).toBe(ownerA)
    expect(doc.lease_id).toBe(lease1)
    expect(doc.rent_due_id).toBe(due1)
    expect(doc.kind).toBe("quittance")
    expect(doc.file_path).toBe(`${lease1}/2026-10-quittance.pdf`)
    expect(doc.created_at).toBeDefined()
  })

  it("remplace un document existant de même kind pour la même échéance (idempotence)", async () => {
    const first = await createDocument(ownerA, {
      lease_id: lease1,
      rent_due_id: due1,
      kind: "quittance",
      file_path: `${lease1}/2026-10-quittance-v1.pdf`,
    })

    const second = await createDocument(ownerA, {
      lease_id: lease1,
      rent_due_id: due1,
      kind: "quittance",
      file_path: `${lease1}/2026-10-quittance-v2.pdf`,
    })

    expect(second.id).toBe(first.id)
    expect(second.file_path).toBe(`${lease1}/2026-10-quittance-v2.pdf`)

    // Il ne doit y avoir qu'un seul document
    const docs = await listDocuments(ownerA, { rentDueId: due1, kind: "quittance" })
    expect(docs.length).toBe(1)
    expect(docs[0].file_path).toBe(`${lease1}/2026-10-quittance-v2.pdf`)
  })

  it("isole strictement les documents par propriétaire", async () => {
    await createDocument(ownerA, {
      lease_id: lease1,
      rent_due_id: due1,
      kind: "quittance",
      file_path: `${lease1}/quittance-a.pdf`,
    })

    const docB = await createDocument(ownerB, {
      lease_id: lease2,
      rent_due_id: due2,
      kind: "recu",
      file_path: `${lease2}/recu-b.pdf`,
    })

    // Owner A ne voit pas le document de Owner B
    const foundByA = await getDocument(ownerA, docB.id)
    expect(foundByA).toBeNull()

    const listA = await listDocuments(ownerA)
    expect(listA.some((d) => d.id === docB.id)).toBe(false)

    // Owner B voit son document
    const foundByB = await getDocument(ownerB, docB.id)
    expect(foundByB).not.toBeNull()
    expect(foundByB?.id).toBe(docB.id)
  })

  it("filtre les documents par lease_id, rent_due_id et kind", async () => {
    const owner = "owner-filter-test"
    const l1 = "lease-f-1"
    const l2 = "lease-f-2"
    const d1 = "due-f-1"
    const d2 = "due-f-2"

    await createDocument(owner, {
      lease_id: l1,
      rent_due_id: d1,
      kind: "quittance",
      file_path: `${l1}/q1.pdf`,
    })

    await createDocument(owner, {
      lease_id: l1,
      rent_due_id: d2,
      kind: "recu",
      file_path: `${l1}/r2.pdf`,
    })

    await createDocument(owner, {
      lease_id: l2,
      rent_due_id: "due-other",
      kind: "quittance",
      file_path: `${l2}/q3.pdf`,
    })

    // Filtre par bail
    const forL1 = await listDocuments(owner, { leaseId: l1 })
    expect(forL1.length).toBe(2)

    // Filtre par échéance
    const forD1 = await listDocuments(owner, { rentDueId: d1 })
    expect(forD1.length).toBe(1)
    expect(forD1[0].kind).toBe("quittance")

    // Filtre par type
    const quittances = await listDocuments(owner, { kind: "quittance" })
    expect(quittances.length).toBe(2)
    const recus = await listDocuments(owner, { kind: "recu" })
    expect(recus.length).toBe(1)

    // Recherche directe par rent_due_id
    const retrievedDue1 = await getDocumentByRentDue(owner, d1)
    expect(retrievedDue1?.kind).toBe("quittance")

    const retrievedDue2 = await getDocumentByRentDue(owner, d2, "recu")
    expect(retrievedDue2?.kind).toBe("recu")

    const retrievedMissing = await getDocumentByRentDue(owner, d2, "quittance")
    expect(retrievedMissing).toBeNull()
  })

  it("supprime un document avec succès et refuse la suppression par un tiers", async () => {
    const doc = await createDocument(ownerA, {
      lease_id: lease1,
      rent_due_id: due1,
      kind: "quittance",
      file_path: `${lease1}/to-delete.pdf`,
    })

    // Tiers tente de supprimer
    const deletedByB = await deleteDocument(ownerB, doc.id)
    expect(deletedByB).toBe(false)

    // Propriétaire légitime supprime
    const deletedByA = await deleteDocument(ownerA, doc.id)
    expect(deletedByA).toBe(true)

    // Le document n'existe plus
    const check = await getDocument(ownerA, doc.id)
    expect(check).toBeNull()
  })
})
