import { BigNumberish } from 'ethers'

export interface DidDocument {
    configurationId: string
    businessData: BusinessData[]
    version: string
}

export interface BusinessData {
    businessId: string
    businessAddress: string
    version: string
}

export interface ContractDidDocumentResult {
    baseDocument: string
    controllers: string[]
    vMethodIds: string[]
    vMethods: [string, number, boolean][]
    vRelationships: VRelationshipResult[]
}

export interface VRelationshipResult {
    name: string
    vMethodId: string
    notBefore: BigNumberish
    notAfter: BigNumberish
    priority: BigNumberish
}

export interface ContractGetDidsResult {
    items: string[]
    total: number
    howMany: number
    prev: number
    next: number
}
