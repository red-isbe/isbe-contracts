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
-------------------------------------------------------------- */
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getDidDocumentFacet, EllipticTypeNames } from './utils'
import { getEvent } from '../../scripts/utils/getEvent'
import { decodeError } from '../../scripts/utils/translateCustomError'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'DidDocumentDetailedFacet'
const EVENT_NAME = 'FirstDidDocumentInserted'

export interface FirstDidDocumentInsertedResult {
    did: string
    baseDocument: string
    vMethodId: string
    publicKey: string
    ellipticType: number
    notBefore: bigint
    notAfter: bigint
    alsoKnownAs: string
}

export async function insertFirstDidDocument(
    hre: HardhatRuntimeEnvironment,
    did: string,
    baseDocument: string,
    vMethodId: string,
    proof: string,
    publicKey: string,
    ellipticType: number,
    notBefore: bigint | number,
    notAfter: bigint | number,
    alsoKnownAs: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<FirstDidDocumentInsertedResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for inserting first DID document...`
    )

    const notBeforeDate = new Date(Number(notBefore) * 1000).toISOString()
    const notAfterDate = new Date(Number(notAfter) * 1000).toISOString()

    console.log('\n📝 Inserting First DID Document...\n')
    console.log(`  DID:           ${did}`)
    console.log(
        `  Base Doc:      ${baseDocument.substring(0, 40)}${baseDocument.length > 40 ? '...' : ''}`
    )
    console.log(`  V-Method ID:   ${vMethodId}`)
    console.log(`  Proof:         ${proof.substring(0, 20)}...`)
    console.log(`  Public Key:    ${publicKey.substring(0, 20)}...`)
    console.log(
        `  Elliptic Type: ${EllipticTypeNames[ellipticType] || ellipticType}`
    )
    console.log(`  Not Before:    ${notBefore} (${notBeforeDate})`)
    console.log(`  Not After:     ${notAfter} (${notAfterDate})`)
    console.log(`  Also Known As: ${alsoKnownAs}`)
    console.log(`  Diamond:       ${diamond}`)
    console.log(`  Curve:         ${signatureProvider.getCurveType()}`)
    console.log('')

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await insertFirstDidDocumentWithRawTransaction(
            hre,
            did,
            baseDocument,
            vMethodId,
            proof,
            publicKey,
            ellipticType,
            notBefore,
            notAfter,
            alsoKnownAs,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const didDocumentFacet = await getDidDocumentFacet(diamond, signer)

    console.log('📡 Sending insertFirstDidDocument transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await didDocumentFacet.insertFirstDidDocument(
            did,
            baseDocument,
            vMethodId,
            proof,
            publicKey,
            ellipticType,
            BigInt(notBefore),
            BigInt(notAfter),
            alsoKnownAs
        )
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        if (error?.data) {
            console.log(
                'Transaction SEND failed: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data))
            )
        } else {
            console.log('Transaction SEND failed: ' + error)
        }
        throw error
    }

    console.log('⏳ Waiting for transaction to be mined...')
    let receipt: TransactionReceipt | null
    try {
        receipt = await tx.wait()
        if (!receipt) throw new Error('Transaction receipt is null')
        if (receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log('Transaction MINING failed: ' + error)
        throw error
    }

    const logDescription: LogDescription | null = await getEvent(
        EVENT_NAME,
        tx,
        didDocumentFacet
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    // Debug: log actual types received
    console.log('\n🔍 Event args types:')
    console.log(`   did: ${typeof args.did} - ${args.did}`)
    console.log(`   baseDocument: ${typeof args.baseDocument}`)
    console.log(`   vMethodId: ${typeof args.vMethodId} - ${args.vMethodId}`)
    console.log(`   publicKey: ${typeof args.publicKey}`)
    console.log(
        `   ellipticType: ${typeof args.ellipticType} - ${args.ellipticType}`
    )
    console.log(`   notBefore: ${typeof args.notBefore} - ${args.notBefore}`)
    console.log(`   notAfter: ${typeof args.notAfter} - ${args.notAfter}`)
    console.log(`   alsoKnownAs: ${typeof args.alsoKnownAs}\n`)

    if (
        typeof args.did !== 'string' ||
        typeof args.baseDocument !== 'string' ||
        typeof args.vMethodId !== 'string' ||
        typeof args.publicKey !== 'string' ||
        (typeof args.ellipticType !== 'number' &&
            typeof args.ellipticType !== 'bigint') ||
        typeof args.notBefore !== 'bigint' ||
        typeof args.notAfter !== 'bigint' ||
        typeof args.alsoKnownAs !== 'string'
    ) {
        throw new Error('Invalid FirstDidDocumentInserted event args format')
    }

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('            FIRST DID DOCUMENT INSERTED                     ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`   DID:           ${args.did}`)
    console.log(`   V-Method ID:   ${args.vMethodId}`)
    console.log(
        `   Elliptic Type: ${EllipticTypeNames[args.ellipticType] || args.ellipticType}`
    )
    console.log(`   Not Before:    ${args.notBefore}`)
    console.log(`   Not After:     ${args.notAfter}`)
    console.log(`   Also Known As: ${args.alsoKnownAs}`)

    return {
        did: args.did,
        baseDocument: args.baseDocument,
        vMethodId: args.vMethodId,
        publicKey: args.publicKey,
        ellipticType:
            typeof args.ellipticType === 'bigint'
                ? Number(args.ellipticType)
                : args.ellipticType,
        notBefore: args.notBefore,
        notAfter: args.notAfter,
        alsoKnownAs: args.alsoKnownAs,
    }
}

/**
 * Insert first DID document using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function insertFirstDidDocumentWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    did: string,
    baseDocument: string,
    vMethodId: string,
    proof: string,
    publicKey: string,
    ellipticType: number,
    notBefore: bigint | number,
    notAfter: bigint | number,
    alsoKnownAs: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<FirstDidDocumentInsertedResult> {
    const { DidDocumentDetailedFacet__factory } =
        await import('../../typechain-types')

    const contractInterface =
        DidDocumentDetailedFacet__factory.createInterface()

    // Encode the insertFirstDidDocument function call
    const functionData = contractInterface.encodeFunctionData(
        'insertFirstDidDocument',
        [
            did,
            baseDocument,
            vMethodId,
            proof,
            publicKey,
            ellipticType,
            BigInt(notBefore),
            BigInt(notAfter),
            alsoKnownAs,
        ]
    )

    console.log('📡 Sending insertFirstDidDocument raw transaction...')

    let txResponse
    try {
        // FIRST simulate tx to catch errors early and avoid gas costs
        await hre.ethers.provider.call({
            to: diamond,
            from: await signatureProvider.getAddress(),
            data: functionData,
        })

        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 500000n,
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        if (error?.data) {
            console.log(
                '   ❌ Error: ' +
                    (await decodeError(hre, CONTRACT_NAME, error.data)) +
                    '\n'
            )
        }
        throw new Error(
            `Failed to submit insertFirstDidDocument raw transaction: ${
                error instanceof Error ? error.message : String(error)
            }`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt
    try {
        receipt = await txResponse.wait()
        if (!receipt || receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse FirstDidDocumentInserted event from the receipt
    const firstDidDocumentInsertedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!firstDidDocumentInsertedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = firstDidDocumentInsertedEvent.args

    // Debug: log actual types received
    console.log('\n🔍 Event args types:')
    console.log(`   did: ${typeof args.did} - ${args.did}`)
    console.log(`   baseDocument: ${typeof args.baseDocument}`)
    console.log(`   vMethodId: ${typeof args.vMethodId} - ${args.vMethodId}`)
    console.log(`   publicKey: ${typeof args.publicKey}`)
    console.log(
        `   ellipticType: ${typeof args.ellipticType} - ${args.ellipticType}`
    )
    console.log(`   notBefore: ${typeof args.notBefore} - ${args.notBefore}`)
    console.log(`   notAfter: ${typeof args.notAfter} - ${args.notAfter}`)
    console.log(`   alsoKnownAs: ${typeof args.alsoKnownAs}\n`)

    if (
        typeof args.did !== 'string' ||
        typeof args.baseDocument !== 'string' ||
        typeof args.vMethodId !== 'string' ||
        typeof args.publicKey !== 'string' ||
        (typeof args.ellipticType !== 'number' &&
            typeof args.ellipticType !== 'bigint') ||
        typeof args.notBefore !== 'bigint' ||
        typeof args.notAfter !== 'bigint' ||
        typeof args.alsoKnownAs !== 'string'
    ) {
        throw new Error('Invalid FirstDidDocumentInserted event args format')
    }

    console.log('\n═══════════════════════════════════════════════════════════')
    console.log('            FIRST DID DOCUMENT INSERTED                     ')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`   DID:           ${args.did}`)
    console.log(`   V-Method ID:   ${args.vMethodId}`)
    console.log(
        `   Elliptic Type: ${EllipticTypeNames[args.ellipticType] || args.ellipticType}`
    )
    console.log(`   Not Before:    ${args.notBefore}`)
    console.log(`   Not After:     ${args.notAfter}`)
    console.log(`   Also Known As: ${args.alsoKnownAs}`)

    return {
        did: args.did,
        baseDocument: args.baseDocument,
        vMethodId: args.vMethodId,
        publicKey: args.publicKey,
        ellipticType:
            typeof args.ellipticType === 'bigint'
                ? Number(args.ellipticType)
                : args.ellipticType,
        notBefore: args.notBefore,
        notAfter: args.notAfter,
        alsoKnownAs: args.alsoKnownAs,
    }
}
