/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
// types/didDocument.types.ts
import type { IDidDocumentDetailed } from '../../../typechain-types'

// Replace TS enum (not supported by some TS strip-only loaders) with a const object + type
export const EllipticType = {
    SECP_256_K1: 1,
    SECP_256_R1: 2,
} as const
export type EllipticType = (typeof EllipticType)[keyof typeof EllipticType]

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
    string, // alsoKnownAs
    string[], // controllers
    string[], // vMethodIds
    IDidDocumentDetailed.VMethodStructOutput[], // vMethods
    IDidDocumentDetailed.VRelationshipStructOutput[], // vRelationships
] & {
    baseDocument: string
    alsoKnownAs: string
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
