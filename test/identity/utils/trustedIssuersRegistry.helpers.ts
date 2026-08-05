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
import { expect } from 'chai'
import {
    ContractTransactionResponse,
    ParamType,
    Signer,
    ZeroHash,
} from 'ethers'
import { TrustedIssuersRegistryFacetInterface } from '../../../typechain-types/contracts/identity/trustedissuersregistry/TrustedIssuersRegistryFacet'
import { TestContext, IssuerType } from './trustedIssuersRegistry.fixtures'
import { randomBytes32 } from '../../support'

// ============================================================================
// Event Interfaces
// ============================================================================

export interface AttributeMetadataSetEvent {
    did: string
    issuerType: string
    revisionId: string
    taoDid: string
    attributeIdTao: string
    attributeId: string
    newRevisionId: string
    rootTaoDid: string
}

export interface AddAttributeRevisionEvent {
    did: string
    attributeId: string
    revisionId: string
    issuerType: string
}

export interface SetAttributeDataEvents {
    did: string
    revisionId: string
    attributeId: string
    issuerType: string
    attributeData: string
}

// ============================================================================
// Event Validator
// ============================================================================

export class EventValidator {
    private contractInterface: TrustedIssuersRegistryFacetInterface

    constructor(contractInterface: TrustedIssuersRegistryFacetInterface) {
        this.contractInterface = contractInterface
    }

    async expectAttributeMetadataSet(
        tx: ContractTransactionResponse,
        expected: AttributeMetadataSetEvent
    ): Promise<void> {
        // AddAttributeRevision event uses 'revisionId' not 'newRevisionId'
        await this.expectEvent(tx, 'AddAttributeRevision', {
            did: expected.did,
            attributeId: expected.attributeId,
            revisionId: expected.newRevisionId,
            issuerType: expected.issuerType,
        })
        await this.expectEvent(tx, 'AttributeMetadataSet', expected)
    }

    async expectAttributeDataSet(
        tx: ContractTransactionResponse,
        expected: SetAttributeDataEvents
    ): Promise<void> {
        await this.expectEvent(tx, 'AttributeDataSet', expected)
        // AddAttributeRevision event uses 'revisionId' not 'newRevisionId'
        await this.expectEvent(tx, 'AddAttributeRevision', {
            did: expected.did,
            attributeId: expected.attributeId,
            revisionId: expected.revisionId,
            issuerType: expected.issuerType,
        })
    }

    private async expectEvent(
        tx: ContractTransactionResponse,
        eventName: string,
        expectedArgs:
            | undefined
            | AttributeMetadataSetEvent
            | AddAttributeRevisionEvent
            | SetAttributeDataEvents
    ): Promise<void> {
        const receipt = await tx.wait()
        if (!receipt?.logs) {
            throw new Error('Transaction failed or no logs available')
        }

        let foundEvent = null
        let inputs: ParamType[] = []

        for (const log of receipt.logs) {
            try {
                const parsedLog = this.contractInterface.parseLog(log)
                if (!parsedLog) continue

                if (parsedLog.name === eventName) {
                    foundEvent = parsedLog.args
                    inputs = parsedLog.fragment.inputs
                    break
                }
            } catch {
                // Continue trying other logs
                continue
            }
        }

        if (!foundEvent) {
            throw new Error(
                `Expected event "${eventName}" not found in transaction logs`
            )
        }

        for (const input of inputs) {
            const name = input.name
            expect(
                foundEvent[name],
                `Mismatch in event field: ${name}`
            ).to.deep.equal(expectedArgs[name])
        }
    }
}

// ============================================================================
// Test Builder - Simplifies creating complex trust hierarchies
// ============================================================================

export class TrustedIssuerTestBuilder {
    private ctx: TestContext

    constructor(ctx: TestContext) {
        this.ctx = ctx
    }

    /**
     * Creates a ROOT_TAO attribute for the given DID
     * @returns The revision ID of the created ROOT_TAO
     */
    async createRootTao(did: string, signer?: Signer): Promise<string> {
        const revisionId = randomBytes32()
        const registry = signer
            ? this.ctx.trustedIssuersRegistry.connect(signer)
            : this.ctx.trustedIssuersRegistry

        await registry.setAttributeMetadata(
            did,
            IssuerType.ROOT_TAO,
            revisionId,
            ZeroHash,
            ZeroHash
        )
        return revisionId
    }

    /**
     * Creates a TAO attribute under a parent TAO/ROOT_TAO
     * @returns The revision ID of the created TAO
     */
    async createTao(
        did: string,
        parentTaoDid: string,
        parentRevisionId: string,
        signer?: Signer
    ): Promise<string> {
        const revisionId = randomBytes32()
        const registry = signer
            ? this.ctx.trustedIssuersRegistry.connect(signer)
            : this.ctx.trustedIssuersRegistry

        await registry.setAttributeMetadata(
            did,
            IssuerType.TAO,
            revisionId,
            parentTaoDid,
            parentRevisionId
        )
        return revisionId
    }

    /**
     * Creates a TI attribute under a TAO
     * @returns The revision ID of the created TI
     */
    async createTi(
        did: string,
        taoDid: string,
        taoRevisionId: string,
        signer?: Signer
    ): Promise<string> {
        const revisionId = randomBytes32()
        const registry = signer
            ? this.ctx.trustedIssuersRegistry.connect(signer)
            : this.ctx.trustedIssuersRegistry

        await registry.setAttributeMetadata(
            did,
            IssuerType.TI,
            revisionId,
            taoDid,
            taoRevisionId
        )
        return revisionId
    }

    /**
     * Creates a complete 3-tier hierarchy: ROOT_TAO -> TAO -> TI
     * Admin is ROOT_TAO, Bob is TAO, Alice is TI
     * @returns Object containing all revision IDs
     */
    async createCompleteHierarchy(): Promise<{
        rootTaoRevisionId: string
        taoRevisionId: string
        tiRevisionId: string
    }> {
        // Create ROOT_TAO for admin
        const rootTaoRevisionId = await this.createRootTao(this.ctx.adminDid)

        // Create TAO for Bob
        const taoRevisionId = await this.createTao(
            this.ctx.bobDid,
            this.ctx.adminDid,
            rootTaoRevisionId
        )

        // Create Alice's DID if not exists
        await this.ensureAliceDid()

        // Create TI for Alice
        const tiRevisionId = await this.createTi(
            this.ctx.aliceDid,
            this.ctx.bobDid,
            taoRevisionId,
            this.ctx.bob
        )

        return { rootTaoRevisionId, taoRevisionId, tiRevisionId }
    }

    /**
     * Ensures Alice has a DID registered and Bob controls it
     */
    async ensureAliceDid(): Promise<void> {
        // Alice's DID is already created with proof derivation in the fixture
        // No need to recreate it - just ensure Bob controls it
        await this.ctx.didRegistry.addController(
            this.ctx.aliceDid,
            this.ctx.bobDid
        )
    }

    /**
     * Adds attribute data to an existing attribute
     * @returns The revision ID of the data (sha256 hash)
     */
    async addAttributeData(
        did: string,
        attributeId: string,
        data: string,
        signer?: Signer
    ): Promise<string> {
        const registry = signer
            ? this.ctx.trustedIssuersRegistry.connect(signer)
            : this.ctx.trustedIssuersRegistry

        const { sha256 } = await import('ethers')
        await registry.setAttributeData(did, attributeId, data)
        return sha256(data)
    }
}
