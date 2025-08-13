// Exportar builders
export { DidDocumentBuilder } from './DidDocumentBuilder'

// Exportar validators y verifiers
export { DidDocumentVerifier } from './DidDocumentVerifier'
export { DidsResultValidator } from './DidResultValidator'
export { VerificationRelationshipResultValidator } from './VerificationRelationshipResultValidator'

// Exportar tipos
export * from '../types/didDocument.types'

// Exportar interfaces de verifier
export type { VerificationOptions } from './DidDocumentVerifier'

export type {
    DidWithPeriod,
    ContractVerificationRelationshipResult,
} from './VerificationRelationshipResultValidator'
