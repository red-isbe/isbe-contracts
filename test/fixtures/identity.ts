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
import { config, ethers } from 'hardhat'
import { HDNodeWallet } from 'ethers'
import { IDidRegistry } from '../../typechain-types'
import {
    DID_DOCUMENT_DETAILED_RESOLVER_KEY,
    CONFIGURATION_ID_DID_REGISTRY,
} from '../../utils/constants'
import { deployGovernance } from './governance'
import {
    randomHex,
    randomDid,
    randomVerificationMethodId,
    randomBaseDocument,
    proofToDid,
    generateProof,
} from '../support'
import { EllipticType } from '../types/identity'

// Test constants
export const TEST_VALIDITY_DURATION = 1000000000000000000n
export const MAX_ROLL_DURATION = 356n * 12n * 60n * 60n // ~1 year in hours

// EllipticType enum values for testing
export const EllipticTypeTest = {
    NONE: 0,
    SECP_256_K1: EllipticType.SECP_256_K1,
    SECP_256_R1: EllipticType.SECP_256_R1,
} as const

/**
 * Basic DID Registry deployment fixture
 * Deploys all DID-related facets and registry without initialization
 */
export async function deployDidRegistryFixture() {
    const [adminSigner, otherSigner] = await ethers.getSigners()
    const otherAddress = await otherSigner.getAddress()

    const gov = await deployGovernance(
        adminSigner,
        undefined,
        CONFIGURATION_ID_DID_REGISTRY
    )

    // Verify deployment
    expect(
        await gov.didDocumentDetailedFacet.businessIdIntrospection()
    ).to.be.equal(DID_DOCUMENT_DETAILED_RESOLVER_KEY)
    expect(
        await gov.didDocumentDetailedFacet.interfacesIntrospection()
    ).to.be.deep.equal(['0xf75e38a6'])

    return {
        admin: adminSigner,
        other: otherSigner,
        otherAddress,
        didDocumentDetailedFacet: gov.didDocumentDetailedFacet,
        didControllerFacet: gov.didControllerFacet,
        didVerificationMethodFacet: gov.didVerificationMethodFacet,
        didVerificationRelationshipFacet: gov.didVerificationRelationshipFacet,
        didRegistry: gov.didRegistry,
        mockTimestamp: gov.mockTimestamp,
    }
}

/**
 * Initialized DID Registry fixture
 * Deploys and initializes the DID registry with SECP_256_K1
 */
export async function deployInitializedDidRegistryFixture() {
    const baseFixture = await deployDidRegistryFixture()

    // Initialize the registry
    await baseFixture.didRegistry.initializeDiDRegistry(
        EllipticType.SECP_256_K1
    )

    return baseFixture
}

/**
 * Utility functions for DID document manipulation
 */
export class DidTestHelpers {
    /**
     * Convert wallet to public key
     */
    static walletToPublicKey(wallet: HDNodeWallet): string {
        return wallet.signingKey.publicKey
    }

    /**
     * Generate randomized DID document data
     */
    static randomizeDidDocument(wallet: HDNodeWallet) {
        return {
            baseDocument: randomBaseDocument(),
            vMethodId: randomVerificationMethodId(),
            publicKeyInvalidLength: randomHex(),
            publicKey65Incorrect: randomHex(65),
            publicKey65: this.walletToPublicKey(wallet),
            publicKey64: '0x'.concat(this.walletToPublicKey(wallet).slice(4)),
            // Use timestamp in the past to ensure capability invocation is immediately active
            notBefore: 1n,
            get notAfter() {
                return this.notBefore + TEST_VALIDITY_DURATION
            },
        }
    }

    /**
     * Get wallet from first hardhat signer
     */
    static walletOfFirstSigner(): HDNodeWallet {
        const mnemonic = (
            config.networks.hardhat.accounts as {
                mnemonic: string
                path: string
            }
        ).mnemonic
        return ethers.Wallet.fromPhrase(mnemonic)
    }

    /**
     * Derive wallet from path
     */
    static deriveWallet(wallet: HDNodeWallet, path: string): HDNodeWallet {
        return wallet.derivePath(path)
    }
}

/**
 * Helper function to insert a controller DID document with random data
 */
export async function insertControllerDocument(
    didRegistry: IDidRegistry,
    controllerId: string,
    proof: string,
    publicKey64: string,
    notBefore: bigint,
    notAfter: bigint
): Promise<void> {
    await didRegistry.insertDidDocument(
        controllerId,
        randomDid(),
        randomDid(),
        proof,
        publicKey64,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter
    )
}

/**
 * Standard test fixture that includes:
 * - Initialized DID registry
 * - Inserted DID document for admin (so admin can call setMockedTimestamp)
 * - Inserted DID document for wallet
 * - Set mock timestamp
 */
export async function deployStandardDidFixture() {
    const baseFixture = await deployInitializedDidRegistryFixture()
    const wallet = DidTestHelpers.walletOfFirstSigner()
    const didData = DidTestHelpers.randomizeDidDocument(wallet)

    // Register admin's DID first so admin can call setMockedTimestamp
    // Use the actual admin signer's wallet (which is the first signer)
    const adminPublicKey = wallet.signingKey.publicKey
    const adminVMethodId = randomVerificationMethodId()
    const adminMessage = ethers.keccak256(
        ethers.solidityPacked(['bytes'], [adminPublicKey])
    )
    const adminSignature = wallet.signingKey.sign(adminMessage)
    const adminProof = ethers.Signature.from(adminSignature).serialized
    const adminDid = proofToDid(adminProof)

    await baseFixture.didRegistry.insertFirstDidDocument(
        adminDid,
        randomBaseDocument(),
        adminVMethodId,
        adminProof,
        adminPublicKey,
        EllipticType.SECP_256_K1,
        didData.notBefore,
        didData.notAfter,
        ''
    )

    // Generate proof-derived DID for insertDidDocument
    const secondWallet = DidTestHelpers.deriveWallet(wallet, '2')
    const proof = generateProof(secondWallet)
    const did = proofToDid(proof)
    const secondPublicKey = secondWallet.signingKey.publicKey

    await baseFixture.didRegistry.insertDidDocument(
        did,
        didData.baseDocument,
        didData.vMethodId,
        proof,
        secondPublicKey,
        EllipticType.SECP_256_K1,
        didData.notBefore,
        didData.notAfter
    )

    await baseFixture.mockTimestamp.setMockedTimestamp(didData.notBefore + 1n)

    return {
        ...baseFixture,
        wallet,
        did,
        didData,
    }
}
