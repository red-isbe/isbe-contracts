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
    randomDid,
    randomBaseDocument,
    randomBytes32,
    randomHex,
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
    return ethers.Wallet.fromPhrase(mnemonic)
}

export async function recoverPublicKeyFromSignature(
    signer: Signer,
    message: string = 'test'
): Promise<string> {
    const signature = await signer.signMessage(message)
    const messageHash = ethers.hashMessage(message)
    const publicKey = ethers.SigningKey.recoverPublicKey(messageHash, signature)
    return publicKey
}

export async function createDidDocument(
    didRegistry: IDidRegistry,
    did: string,
    wallet: HDNodeWallet,
    notBefore: bigint,
    notAfter: bigint
): Promise<void> {
    const publicKey65 = wallet.signingKey.publicKey
    const message = ethers.keccak256(
        ethers.solidityPacked(['bytes'], [publicKey65])
    )
    const signature = wallet.signingKey.sign(message)
    const proof = ethers.Signature.from(signature).serialized

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
}

export async function createDidDocumentForSigner(
    didRegistry: IDidRegistry,
    did: string,
    signer: Signer,
    notBefore: bigint,
    notAfter: bigint
): Promise<void> {
    const publicKey = await recoverPublicKeyFromSignature(signer)
    await didRegistry.insertDidDocument(
        did,
        randomBaseDocument(),
        randomBytes32(),
        '0x'.concat(publicKey.slice(4)),
        EllipticType.SECP_256_K1,
        notBefore,
        notAfter
    )
}

// ============================================================================
// Fixtures
// ============================================================================

/**
 * Minimal fixture - just deploy contracts
 * Use this for tests that don't need DIDs (e.g., access control, paused state)
 */
export async function deployContractsFixture(): Promise<Partial<TestContext>> {
    const [admin, bob, alice] = await ethers.getSigners()

    const gov = await deployGovernance(admin, [], CONFIGURATION_ID_DID_REGISTRY)

    return {
        didRegistry: gov.didRegistry,
        pause: gov.pauseGovernance,
        trustedIssuersRegistry: gov.trustedIssuersRegistry,
        trustedIssuersRegistryFacet: gov.trustedIssuersRegistryFacet,
        mockTimestamp: gov.mockTimestamp,
        admin,
        bob,
        alice,
        adminAddress: await admin.getAddress(),
        bobAddress: await bob.getAddress(),
        aliceAddress: await alice.getAddress(),
    }
}

/**
 * Standard fixture - contracts + initialized DIDs
 * Use this for most tests that need basic DID infrastructure
 */
export async function deployWithDidsFixture(): Promise<TestContext> {
    const base = await deployContractsFixture()
    const wallet = walletOfFirstSigner()

    const notBefore = 5n
    const notAfter = notBefore + TEST_VALIDITY_DURATION
    const blockTimestamp = notBefore + 1n

    await base.didRegistry!.initializeDiDRegistry(EllipticType.SECP_256_K1)

    const adminDid = randomDid()
    const bobDid = randomDid()
    const aliceDid = randomDid()

    // Create admin DID
    await createDidDocument(
        base.didRegistry!,
        adminDid,
        wallet,
        notBefore,
        notAfter
    )

    // Create bob DID
    await createDidDocumentForSigner(
        base.didRegistry!,
        bobDid,
        base.bob!,
        notBefore,
        notAfter
    )
    await base.didRegistry!.addController(bobDid, adminDid)

    await base.mockTimestamp!.setMockedTimestamp(blockTimestamp)

    return {
        ...base,
        wallet,
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
