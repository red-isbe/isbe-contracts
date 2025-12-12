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
