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
import { ethers, config } from 'hardhat'
import {
    IDidRegistry,
    ITrustedIssuersRegistry,
    MockTimestampFacet,
    Pause,
    TrustedIssuersRegistryFacet,
} from '../../../typechain-types'
import { HDNodeWallet, Signer, ZeroHash } from 'ethers'
import { CONFIGURATION_ID_DID_REGISTRY } from '../../../utils/constants'
import { deployGovernance } from '../../fixtures/governance'
import {
    randomBaseDocument,
    randomBytes32,
    randomHex,
    proofToDid,
    generateProof,
} from '../../support'
import { EllipticType } from '../../types/identity'

// ============================================================================
// Test Context Interface
// ============================================================================

export interface TestContext {
    // Contracts
    didRegistry: IDidRegistry
    pause: Pause
    mockTimestamp: MockTimestampFacet
    trustedIssuersRegistry: ITrustedIssuersRegistry
    trustedIssuersRegistryFacet: TrustedIssuersRegistryFacet

    // Signers
    admin: Signer
    bob: Signer
    alice: Signer
    adminAddress: string
    bobAddress: string
    aliceAddress: string

    // Test Data
    wallet: HDNodeWallet
    adminDid: string
    bobDid: string
    aliceDid: string

    // Timestamps
    notBefore: bigint
    notAfter: bigint
    blockTimestamp: bigint
}

// ============================================================================
// Constants
// ============================================================================

const TEST_VALIDITY_DURATION = 1000000000000000000n

export const IssuerType = {
    NONE: 0,
    ROOT_TAO: 1,
    TAO: 2,
    TI: 3,
    REVOKED: 4,
}

// ============================================================================
// Helper Functions
// ============================================================================

export function walletOfFirstSigner(): HDNodeWallet {
    const mnemonic = (
        config.networks.hardhat.accounts as {
            mnemonic: string
            path: string
        }
    ).mnemonic
    return HDNodeWallet.fromPhrase(mnemonic)
}

export function walletFromMnemonic(mnemonic: string): HDNodeWallet {
    return ethers.Wallet.fromPhrase(mnemonic)
}

export async function getSignersWithProvider(): Promise<
    [Signer, Signer, Signer]
> {
    const [admin, bob, alice] = await ethers.getSigners()
    return [admin, bob, alice]
}

export async function createDidDocument(
    didRegistry: IDidRegistry,
    wallet: HDNodeWallet,
    notBefore: bigint,
    notAfter: bigint
): Promise<string> {
    const proof = generateProof(wallet)
    const did = proofToDid(proof)
    const publicKey65 = wallet.signingKey.publicKey

    await didRegistry.insertFirstDidDocument(
        did,
        randomBaseDocument(),
        randomHex(32),
        proof,
        publicKey65,
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter,
        ''
    )

    return did
}

// ============================================================================
// Fixtures
// ============================================================================

/**
 * Minimal fixture - just deploy contracts
 * Use this for tests that don't need DIDs (e.g., access control, paused state)
 */
export async function deployContractsFixture(): Promise<Partial<TestContext>> {
    // Get signers with providers for deployment
    const [adminSigner, bobSigner, aliceSigner] = await getSignersWithProvider()
    const adminWallet = walletOfFirstSigner().connect(ethers.provider)
    const accountsConfig = config.networks.hardhat.accounts as {
        mnemonic: string
        path: string
    }
    const bobWallet = HDNodeWallet.fromPhrase(
        accountsConfig.mnemonic,
        '',
        "m/44'/60'/0'/0/1"
    ).connect(ethers.provider)
    const aliceWallet = HDNodeWallet.fromPhrase(
        accountsConfig.mnemonic,
        '',
        "m/44'/60'/0'/0/2"
    ).connect(ethers.provider)

    const gov = await deployGovernance(
        adminSigner,
        [],
        CONFIGURATION_ID_DID_REGISTRY
    )

    return {
        didRegistry: gov.didRegistry,
        pause: gov.pauseGovernance,
        trustedIssuersRegistry: gov.trustedIssuersRegistry,
        trustedIssuersRegistryFacet: gov.trustedIssuersRegistryFacet,
        mockTimestamp: gov.mockTimestamp,
        admin: adminWallet,
        bob: bobWallet,
        alice: aliceWallet,
        wallet: adminWallet,
        adminAddress: await adminSigner.getAddress(),
        bobAddress: await bobSigner.getAddress(),
        aliceAddress: await aliceSigner.getAddress(),
    }
}

/**
 * Standard fixture - contracts + initialized DIDs
 * Use this for most tests that need basic DID infrastructure
 */
export async function deployWithDidsFixture(): Promise<TestContext> {
    const base = await deployContractsFixture()
    const adminWallet = base.wallet!

    const notBefore = 5n
    const notAfter = notBefore + TEST_VALIDITY_DURATION
    const blockTimestamp = notBefore + 1n

    await base.didRegistry!.initializeDiDRegistry(EllipticType.SECP_256_K1)

    // Create admin DID (proof-derived)
    const adminDid = await createDidDocument(
        base.didRegistry!,
        adminWallet,
        notBefore,
        notAfter
    )

    // Create bob DID (proof-derived)
    const bobDid = await createDidDocument(
        base.didRegistry!,
        base.bob as HDNodeWallet,
        notBefore,
        notAfter
    )

    // Add admin as controller of bob's DID (bob must do this since addController now requires authorization)
    await base.didRegistry!.connect(base.bob).addController(bobDid, adminDid)

    // Create alice DID (proof-derived)
    const aliceDid = await createDidDocument(
        base.didRegistry!,
        base.alice as HDNodeWallet,
        notBefore,
        notAfter
    )

    // Add admin as controller of alice's DID (alice must do this since addController now requires authorization)
    await base
        .didRegistry!.connect(base.alice)
        .addController(aliceDid, adminDid)

    await base.mockTimestamp!.setMockedTimestamp(blockTimestamp)

    return {
        ...base,
        wallet: adminWallet,
        adminDid,
        bobDid,
        aliceDid,
        notBefore,
        notAfter,
        blockTimestamp,
    } as TestContext
}

/**
 * Full fixture - with ROOT_TAO setup
 * Use this for tests that need a complete trust hierarchy
 */
export async function deployWithRootTaoFixture(): Promise<
    TestContext & { rootTaoRevisionId: string }
> {
    const ctx = await deployWithDidsFixture()

    const rootTaoRevisionId = randomBytes32()
    await ctx.trustedIssuersRegistry.setAttributeMetadata(
        ctx.adminDid,
        IssuerType.ROOT_TAO,
        rootTaoRevisionId,
        ZeroHash,
        ZeroHash
    )

    return { ...ctx, rootTaoRevisionId }
}
