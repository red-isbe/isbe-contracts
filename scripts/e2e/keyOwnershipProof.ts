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

/**
 * E2E check of ISBECORE-435 (key ownership proof in addVerificationMethod and
 * rollVerificationMethod) against a real network.
 *
 *   npx hardhat run scripts/e2e/keyOwnershipProof.ts --network isbe
 *   DIAMOND=0x... npx hardhat run scripts/e2e/keyOwnershipProof.ts --network isbe
 *
 * Only ONE transaction is sent: insertFirstDidDocument of a new test DID, signed by the
 * network signer (local key or AWS KMS), which needs DID_REGISTRY_ROLE. Every other check
 * runs as eth_call from the test DID's key, so it needs no gas and changes nothing.
 */
import hre from 'hardhat'
import {
    Contract,
    Interface,
    Wallet,
    ZeroHash,
    type HDNodeWallet,
    type Signer,
} from 'ethers'
import { SignatureProviderFactory } from '../../tasks/deployment/providers/SignatureProviderFactory'
import { DID_REGISTRY_ROLE } from '../../utils/constants'
import {
    generateProof,
    proofToDid,
    generateKeyOwnershipProof,
    isbeDomain,
} from '../../test/support/identity/did'

const SECP_256_K1 = 1
const ONE_YEAR = 365n * 24n * 60n * 60n

interface Check {
    name: string
    ok: boolean
    detail: string
}

async function registryAbi(): Promise<Interface> {
    const names = [
        'DidDocumentDetailedFacet',
        'DidVerificationMethodFacet',
        'DidRegistryQueryFacet',
        'AccessControlGovernanceFacet',
    ]
    const seen = new Set<string>()
    const fragments: unknown[] = []
    for (const name of names) {
        const { abi } = await hre.artifacts.readArtifact(name)
        for (const f of abi) {
            const key = JSON.stringify(f)
            if (!seen.has(key)) {
                seen.add(key)
                fragments.push(f)
            }
        }
    }
    return new Interface(fragments as never)
}

function revertName(iface: Interface, error: unknown): string {
    const e = error as { data?: string; revert?: { name?: string } }
    if (e.revert?.name) return e.revert.name
    if (typeof e.data === 'string' && e.data.length >= 10) {
        try {
            return iface.parseError(e.data)?.name ?? e.data.slice(0, 10)
        } catch {
            return e.data.slice(0, 10)
        }
    }
    return String((error as Error).message ?? error).slice(0, 120)
}

export async function runKeyOwnershipE2E(
    diamond: string,
    signer: Signer
): Promise<Check[]> {
    const provider = hre.ethers.provider
    const iface = await registryAbi()
    const asSigner = new Contract(diamond, iface, signer)
    const reader = new Contract(diamond, iface, provider)
    const { chainId } = await provider.getNetwork()
    const domain = isbeDomain(chainId, diamond)
    const checks: Check[] = []

    const expectOk = async (name: string, call: () => Promise<unknown>) => {
        try {
            await call()
            checks.push({ name, ok: true, detail: 'ok' })
        } catch (e) {
            checks.push({ name, ok: false, detail: revertName(iface, e) })
        }
    }
    const expectRevert = async (
        name: string,
        expected: string,
        call: () => Promise<unknown>
    ) => {
        try {
            await call()
            checks.push({ name, ok: false, detail: 'did NOT revert' })
        } catch (e) {
            const got = revertName(iface, e)
            checks.push({ name, ok: got === expected, detail: got })
        }
    }

    const sender = await signer.getAddress()
    if (!(await reader.hasRole(DID_REGISTRY_ROLE, sender))) {
        throw new Error(`${sender} has no DID_REGISTRY_ROLE on ${diamond}`)
    }

    // Test identities: A (controller), B (has no DID), K and R (new keys of A)
    const a = Wallet.createRandom()
    const b = Wallet.createRandom()
    const k = Wallet.createRandom()
    const r = Wallet.createRandom()
    const now = BigInt((await provider.getBlock('latest'))!.timestamp)
    const notBefore = now - 60n
    const notAfter = now + ONE_YEAR

    // 1. The only transaction: create DID A
    const proofA = generateProof(a)
    const didA = proofToDid(proofA)
    const vm1 = hre.ethers.id(`${didA}#key-1`)
    console.log(`📝 Creating test DID ${didA} (key ${a.address})...`)
    const tx = await asSigner.insertFirstDidDocument(
        didA,
        'e2e ISBECORE-435',
        vm1,
        proofA,
        a.signingKey.publicKey,
        SECP_256_K1,
        notBefore,
        notAfter,
        ''
    )
    const receipt = await tx.wait()
    console.log(`   ✅ tx ${receipt?.hash} (block ${receipt?.blockNumber})`)
    checks.push({
        name: 'didOf(A) resolves to the new DID',
        ok: (await reader.didOf(a.address)) === didA,
        detail: await reader.didOf(a.address),
    })

    // Every call below is eth_call from A's address
    const fromA = { from: a.address }
    const add = (pk: string, vm: string, proof: string) =>
        reader.addVerificationMethod.staticCall(
            didA,
            vm,
            pk,
            proof,
            SECP_256_K1,
            fromA
        )
    const proofOf = (
        w: HDNodeWallet,
        did: string,
        vm: string,
        pk: string,
        d = domain
    ) => generateKeyOwnershipProof(w, did, vm, pk, d)

    // 2. Attack: A adds B's key with a proof made by A itself
    const vmB = hre.ethers.id(`${didA}#stolen`)
    await expectRevert(
        'ATTACK: add the key of someone without DID, proof signed by attacker',
        'InvalidSignature',
        async () =>
            add(
                b.signingKey.publicKey,
                vmB,
                await proofOf(a, didA, vmB, b.signingKey.publicKey)
            )
    )
    await expectRevert(
        'ATTACK: same with the old proof format (hash of the public key)',
        'InvalidSignature',
        async () => add(b.signingKey.publicKey, vmB, generateProof(b))
    )
    checks.push({
        name: 'didOf(B) is still empty',
        ok: (await reader.didOf(b.address)) === ZeroHash,
        detail: await reader.didOf(b.address),
    })
    const proofB = generateProof(b)
    await expectOk('B can still create its own DID (simulated)', () =>
        asSigner.insertFirstDidDocument.staticCall(
            proofToDid(proofB),
            'e2e ISBECORE-435 B',
            hre.ethers.id('b#key-1'),
            proofB,
            b.signingKey.publicKey,
            SECP_256_K1,
            notBefore,
            notAfter,
            ''
        )
    )

    // 3. add: valid and invalid proofs
    const vmK = hre.ethers.id(`${didA}#key-2`)
    const pkK = k.signingKey.publicKey
    await expectOk(
        'add: valid proof signed by the new key (simulated)',
        async () => add(pkK, vmK, await proofOf(k, didA, vmK, pkK))
    )
    await expectRevert('add: no proof', 'WrongSignatureLength', () =>
        add(pkK, vmK, '0x')
    )
    await expectRevert(
        'add: proof for another DID',
        'InvalidSignature',
        async () =>
            add(pkK, vmK, await proofOf(k, hre.ethers.id('other'), vmK, pkK))
    )
    await expectRevert(
        'add: proof for another network (chainId + 1)',
        'InvalidSignature',
        async () =>
            add(
                pkK,
                vmK,
                await proofOf(
                    k,
                    didA,
                    vmK,
                    pkK,
                    isbeDomain(chainId + 1n, diamond)
                )
            )
    )

    // 4. roll
    const vmR = hre.ethers.id(`${didA}#key-3`)
    const pkR = r.signingKey.publicKey
    const roll = (proof: string) =>
        reader.rollVerificationMethod.staticCall(
            {
                did: didA,
                vMethodId: vmR,
                publicKey: pkR,
                ellipticType: SECP_256_K1,
                notBefore: now + 3600n,
                notAfter: now + ONE_YEAR,
                oldVMethodId: vm1,
                duration: 3600n,
                proof,
            },
            fromA
        )
    await expectOk(
        'roll: valid proof signed by the new key (simulated)',
        async () => roll(await proofOf(r, didA, vmR, pkR))
    )
    await expectRevert('roll: no proof', 'WrongSignatureLength', () =>
        roll('0x')
    )
    await expectRevert(
        'roll: proof signed by another key',
        'InvalidSignature',
        async () => roll(await proofOf(a, didA, vmR, pkR))
    )

    return checks
}

async function main() {
    const diamond =
        process.env.DIAMOND ?? '0x00000000000000000000000000000000000015BE'
    const signer = await SignatureProviderFactory.create(hre).getSigner()
    console.log(`🌐 Network: ${hre.network.name}  Diamond: ${diamond}`)
    console.log(`🔑 Signer: ${await signer.getAddress()}\n`)

    const checks = await runKeyOwnershipE2E(diamond, signer)
    console.log('')
    for (const c of checks) {
        console.log(`${c.ok ? '✅' : '❌'} ${c.name}  [${c.detail}]`)
    }
    const failed = checks.filter((c) => !c.ok).length
    console.log(`\n${checks.length - failed}/${checks.length} checks passed`)
    if (failed > 0) process.exitCode = 1
}

if (require.main === module) {
    main().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
