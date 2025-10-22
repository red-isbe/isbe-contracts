import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import { HDNodeWallet } from 'ethers'
import { IDidRegistry } from '../../typechain-types'
import { DID_DOCUMENT_DETAILED_RESOLVER_KEY } from '../constants'
import {
    CONFIGURATION_ID_DID_REGISTRY,
    deployGovernance,
} from '../initialization'
import { randomHex, randomInt, TestConstants } from '../testUtils'
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
            baseDocument: TestConstants.randomBaseDocument(),
            vMethodId: TestConstants.randomVerificationMethodId(),
            publicKeyInvalidLength: randomHex(),
            publicKey65Incorrect: randomHex(65),
            publicKey65: this.walletToPublicKey(wallet),
            publicKey64: '0x'.concat(this.walletToPublicKey(wallet).slice(4)),
            notBefore: randomInt(),
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
    publicKey64: string,
    notBefore: bigint,
    notAfter: bigint
): Promise<void> {
    await didRegistry.insertDidDocument(
        controllerId,
        TestConstants.randomDid(),
        TestConstants.randomDid(),
        publicKey64,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter
    )
}

/**
 * Standard test fixture that includes:
 * - Initialized DID registry
 * - Inserted DID document
 * - Set mock timestamp
 */
export async function deployStandardDidFixture() {
    const baseFixture = await deployInitializedDidRegistryFixture()
    const wallet = DidTestHelpers.walletOfFirstSigner()
    const didData = DidTestHelpers.randomizeDidDocument(wallet)

    const did = TestConstants.randomDid()

    await baseFixture.didRegistry.insertDidDocument(
        did,
        didData.baseDocument,
        didData.vMethodId,
        didData.publicKey65,
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
