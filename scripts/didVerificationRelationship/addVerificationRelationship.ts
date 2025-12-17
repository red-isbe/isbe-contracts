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
import { getEvent } from '../utils/getEvent'
import { decodeError } from '../utils/translateCustomError'
import { ISignatureProvider } from '../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const CONTRACT_NAME = 'DidVerificationRelationshipFacet'
const EVENT_NAME = 'VerificationRelationshipAdded'

const VALID_NAMES = [
    'authentication',
    'assertionMethod',
    'keyAgreement',
    'capabilityInvocation',
    'capabilityDelegation',
]

export interface VerificationRelationshipAddedResult {
    did: string
    name: string
    vMethodId: string
    notBefore: bigint
    notAfter: bigint
}

async function loadDidVerificationRelationshipFactory() {
    const { DidVerificationRelationshipFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationRelationshipFacet__factory
}

export async function addVerificationRelationship(
    hre: HardhatRuntimeEnvironment,
    did: string,
    name: string,
    vMethodId: string,
    notBefore: bigint | number,
    notAfter: bigint | number,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<VerificationRelationshipAddedResult> {
    if (!VALID_NAMES.includes(name)) {
        throw new Error(
            `Invalid relationship name. Use: ${VALID_NAMES.join(' | ')}`
        )
    }

    console.log(
        `🔗 Using ${signatureProvider.getCurveType()} signature for adding verification relationship...`
    )

    const notBeforeBigInt = BigInt(notBefore)
    const notAfterBigInt = BigInt(notAfter)

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await addVerificationRelationshipWithRawTransaction(
            hre,
            did,
            name,
            vMethodId,
            notBeforeBigInt,
            notAfterBigInt,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const DidVerificationRelationshipFacet__factory =
        await loadDidVerificationRelationshipFactory()
    const didVerificationRelationshipFacet =
        DidVerificationRelationshipFacet__factory.connect(diamond, signer)

    console.log('📡 Sending addVerificationRelationship transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await didVerificationRelationshipFacet.addVerificationRelationship(
            did,
            name,
            vMethodId,
            notBeforeBigInt,
            notAfterBigInt
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
        didVerificationRelationshipFacet
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (
        typeof args.did !== 'string' ||
        typeof args.name !== 'string' ||
        typeof args.vMethodId !== 'string' ||
        typeof args.notBefore !== 'bigint' ||
        typeof args.notAfter !== 'bigint'
    ) {
        throw new Error(
            'Invalid VerificationRelationshipAdded event args format'
        )
    }

    const {
        did: evDid,
        name: evName,
        vMethodId: evVMethodId,
        notBefore: evNotBefore,
        notAfter: evNotAfter,
    } = args

    if (evDid !== did || evName !== name || evVMethodId !== vMethodId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Verification relationship added successfully:`)
    console.log(`   DID: ${evDid}`)
    console.log(`   Name: ${evName}`)
    console.log(`   V-Method ID: ${evVMethodId}`)
    console.log(`   Not Before: ${evNotBefore}`)
    console.log(`   Not After: ${evNotAfter}`)

    return {
        did: evDid,
        name: evName,
        vMethodId: evVMethodId,
        notBefore: evNotBefore,
        notAfter: evNotAfter,
    }
}

/**
 * Add verification relationship using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function addVerificationRelationshipWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    did: string,
    name: string,
    vMethodId: string,
    notBefore: bigint,
    notAfter: bigint,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<VerificationRelationshipAddedResult> {
    const { IDidVerificationRelationship__factory } =
        await import('../../typechain-types')

    const contractInterface =
        IDidVerificationRelationship__factory.createInterface()

    // Encode the addVerificationRelationship function call
    const functionData = contractInterface.encodeFunctionData(
        'addVerificationRelationship',
        [did, name, vMethodId, notBefore, notAfter]
    )

    console.log('📡 Sending addVerificationRelationship raw transaction...')

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
            gasLimit: 900000n, // Reasonable gas limit for addVerificationRelationship
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
            `Failed to submit addVerificationRelationship raw transaction: ${
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

    // Parse VerificationRelationshipAdded event from the receipt
    const verificationRelationshipAddedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!verificationRelationshipAddedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = verificationRelationshipAddedEvent.args

    if (
        typeof args.did !== 'string' ||
        typeof args.name !== 'string' ||
        typeof args.vMethodId !== 'string' ||
        typeof args.notBefore !== 'bigint' ||
        typeof args.notAfter !== 'bigint'
    ) {
        throw new Error(
            'Invalid VerificationRelationshipAdded event args format'
        )
    }

    const {
        did: evDid,
        name: evName,
        vMethodId: evVMethodId,
        notBefore: evNotBefore,
        notAfter: evNotAfter,
    } = args

    if (evDid !== did || evName !== name || evVMethodId !== vMethodId) {
        console.warn(
            'Warning: Bad state detected. Check manually if operation has been processed correctly.'
        )
    }

    console.log(`\n✅ Verification relationship added successfully:`)
    console.log(`   DID: ${evDid}`)
    console.log(`   Name: ${evName}`)
    console.log(`   V-Method ID: ${evVMethodId}`)
    console.log(`   Not Before: ${evNotBefore}`)
    console.log(`   Not After: ${evNotAfter}`)

    return {
        did: evDid,
        name: evName,
        vMethodId: evVMethodId,
        notBefore: evNotBefore,
        notAfter: evNotAfter,
    }
}
