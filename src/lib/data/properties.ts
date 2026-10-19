import "server-only"
import { readStore, mutateStore, generateUUID, currentISO } from "./local/store"
import type { Property, NewProperty } from "./types"
import { NotFoundError, HasLeasesError } from "./errors"

export async function listProperties(
  ownerId: string,
  options: { includeArchived?: boolean } = {}
): Promise<Property[]> {
  const store = await readStore()
  return store.properties.filter((p) => {
    if (p.owner_id !== ownerId) return false
    if (!options.includeArchived && p.archived_at !== null) return false
    return true
  })
}

export async function getProperty(
  ownerId: string,
  id: string
): Promise<Property | null> {
  const store = await readStore()
  const property = store.properties.find((p) => p.id === id && p.owner_id === ownerId)
  return property ?? null
}

export async function createProperty(
  ownerId: string,
  data: NewProperty
): Promise<Property> {
  return mutateStore((current) => {
    const newProperty: Property = {
      id: generateUUID(),
      owner_id: ownerId,
      name: data.name,
      type: data.type,
      address_line1: data.address_line1,
      address_line2: data.address_line2 ?? null,
      postal_code: data.postal_code,
      city: data.city,
      country: data.country ?? "GA",
      surface_m2: data.surface_m2 ?? null,
      notes: data.notes ?? null,
      archived_at: data.archived_at ?? null,
      created_at: currentISO(),
    }

    return {
      nextData: {
        ...current,
        properties: [...current.properties, newProperty],
      },
      result: newProperty,
    }
  })
}

export async function updateProperty(
  ownerId: string,
  id: string,
  data: Partial<NewProperty>
): Promise<Property> {
  return mutateStore((current) => {
    const index = current.properties.findIndex(
      (p) => p.id === id && p.owner_id === ownerId
    )
    if (index === -1) {
      throw new NotFoundError("Bien", id)
    }

    const updated: Property = {
      ...current.properties[index],
      ...data,
    }

    const nextProperties = [...current.properties]
    nextProperties[index] = updated

    return {
      nextData: {
        ...current,
        properties: nextProperties,
      },
      result: updated,
    }
  })
}

export async function archiveProperty(
  ownerId: string,
  id: string,
  archive = true
): Promise<Property> {
  return updateProperty(ownerId, id, {
    archived_at: archive ? currentISO() : null,
  })
}

export async function deleteProperty(
  ownerId: string,
  id: string
): Promise<void> {
  return mutateStore((current) => {
    const property = current.properties.find(
      (p) => p.id === id && p.owner_id === ownerId
    )
    if (!property) {
      throw new NotFoundError("Bien", id)
    }

    // Integrity rule: cannot delete a property that has leases
    const hasLeases = current.leases.some(
      (l) => l.property_id === id && l.owner_id === ownerId
    )
    if (hasLeases) {
      throw new HasLeasesError("bien")
    }

    return {
      nextData: {
        ...current,
        properties: current.properties.filter((p) => p.id !== id),
      },
      result: undefined,
    }
  })
}
