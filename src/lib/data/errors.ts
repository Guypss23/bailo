export class DataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataError'
  }
}

export class NotFoundError extends DataError {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} avec l'identifiant ${id} est introuvable.` : `${entity} introuvable.`)
    this.name = 'NotFoundError'
  }
}

export class LeaseOverlapError extends DataError {
  constructor(message = "Un autre bail actif ou terminé chevauche déjà cette période pour ce bien.") {
    super(message)
    this.name = 'LeaseOverlapError'
  }
}

export class DuplicateRentDueError extends DataError {
  constructor(leaseId: string, period: string) {
    super(`Une échéance existe déjà pour le bail ${leaseId} sur la période ${period}.`)
    this.name = 'DuplicateRentDueError'
  }
}

export class HasLeasesError extends DataError {
  constructor(entity: 'bien' | 'locataire') {
    super(
      entity === 'bien'
        ? "Impossible de supprimer ce bien car il est rattaché à un ou plusieurs baux. Archivez-le plutôt."
        : "Impossible de supprimer ce locataire car il est rattaché à un ou plusieurs baux. Archivez-le plutôt."
    )
    this.name = 'HasLeasesError'
  }
}

export class ValidationError extends DataError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
