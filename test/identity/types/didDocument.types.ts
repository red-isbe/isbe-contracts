// types/didDocument.types.ts
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
    Array<[string, number, boolean]>, // vMethods: [publicKey, ellipticType, revoked]
    Array<[string, string, bigint, bigint, number]>, // vRelationships: [relationshipType, vMethodId, notBefore, notAfter, status]
]

export type ContractGetDidsResult = [
    string[], // dids
    number, // totalCount
    number, // filteredCount
    bigint, // pageNumber
    bigint, // totalPages
]

export type ContractVMethodTuple = [string, number, boolean]
export type ContractVRelationshipTuple = [
    string,
    string,
    bigint,
    bigint,
    number,
]
