// types/didDocument.types.ts
import type { IDidDocumentDetailed } from '../../../typechain-types'

export enum EllipticType {
    SECP_256_K1 = 1,
    SECP_256_R1 = 2,
}

export interface VMethod {
    publicKey: string
    ellipticType: EllipticType
    revoked: boolean
}

export interface VRelationship {
    relationshipType: string
    vMethodId: string
    notBefore: bigint
    notAfter: bigint
    status: number
}

export interface DidDocumentResult {
    baseDocument: string
    controllers: string[]
    vMethodIds: string[]
    vMethods: VMethod[]
    vRelationships: VRelationship[]
}

export interface ExpectedDidDocument {
    baseDocument: string
    controllers: string[]
    vMethodIds: string[]
    vMethods: VMethod[]
    vRelationships: VRelationship[]
}

// Tipos para los resultados que devuelve el contrato
export type ContractDidDocumentResult = [
    string, // baseDocument
    string[], // controllers
    string[], // vMethodIds
    IDidDocumentDetailed.VMethodStructOutput[], // vMethods
    IDidDocumentDetailed.VRelationshipStructOutput[], // vRelationships
] & {
    baseDocument: string
    controllers: string[]
    vMethodIds: string[]
    vMethods: IDidDocumentDetailed.VMethodStructOutput[]
    vRelationships: IDidDocumentDetailed.VRelationshipStructOutput[]
}

export type ContractGetDidsResult = [
    string[], // dids
    bigint, // totalCount
    bigint, // filteredCount
    bigint, // pageNumber
    bigint, // totalPages
] & {
    items: string[]
    total: bigint
    howMany: bigint
    prev: bigint
    next: bigint
}

export type ContractVMethodTuple = IDidDocumentDetailed.VMethodStructOutput
export type ContractVRelationshipTuple =
    IDidDocumentDetailed.VRelationshipStructOutput
