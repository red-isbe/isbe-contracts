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
import { getClientFiltering } from '../../utils/getClientFiltering'
import { getEvent } from '../../utils/getEvent'
import { decodeError } from '../../utils/translateCustomError'
import { ISignatureProvider } from '../../../tasks/index'
import {
    ContractTransactionResponse,
    LogDescription,
    TransactionReceipt,
    ZeroHash,
    toUtf8Bytes,
    zeroPadBytes,
} from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import type { AddressLike, BytesLike, BigNumberish } from 'ethers'
import { IClientFiltering } from '../../../typechain-types'

const CONTRACT_NAME = 'ClientFilteringFacet'
const EVENT_NAME = 'FilterUpdated'

export interface UpdateFilterResult {
    filterId: string
    filterType: number
    transactionHash: string
    contractAddress: string
    signature: string
    jsonRpcMethod: string
    initialBlock: bigint
    endBlock: bigint
    disabled: boolean
}

export interface FilterParams {
    filterId: string
    filterType: number
    transactionHash: string
    contractAddress: string
    signature: string
    jsonRpcMethod: string
    initialBlock: bigint
    endBlock: bigint
    disabled: boolean
}

function toBytes32(str: string): string {
    if (str.length === 0) return ZeroHash
    const utf8Bytes = toUtf8Bytes(str.slice(0, 32))
    return zeroPadBytes(utf8Bytes, 32)
}

export async function updateFilter(
    hre: HardhatRuntimeEnvironment,
    clientFilteringAddress: string,
    filterParams: FilterParams,
    signatureProvider: ISignatureProvider
): Promise<UpdateFilterResult> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for filter update...`
    )

    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await updateFilterWithRawTransaction(
            hre,
            clientFilteringAddress,
            filterParams,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const clientFiltering = await getClientFiltering(
        clientFilteringAddress,
        signer
    )

    const contractFilterData = {
        filterId: filterParams.filterId as BytesLike,
        filterType: filterParams.filterType as BigNumberish,
        transactionHash: filterParams.transactionHash as BytesLike,
        contractAddress: filterParams.contractAddress as AddressLike,
        signature: filterParams.signature as BytesLike,
        jsonRpcMethod: toBytes32(filterParams.jsonRpcMethod) as BytesLike,
        initialBlock: filterParams.initialBlock as BigNumberish,
        endBlock: filterParams.endBlock as BigNumberish,
        disabled: filterParams.disabled,
    } as IClientFiltering.FilterStruct

    console.log('📡 Sending updateFilter transaction...')
    let tx: ContractTransactionResponse
    try {
        tx = await clientFiltering.updateFilter(contractFilterData)
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
        clientFiltering
    )

    if (!logDescription) {
        throw new Error(`${EVENT_NAME} event not found in transaction logs`)
    }

    const args = logDescription.args

    if (
        typeof args.filterId !== 'string' ||
        typeof args.filterType !== 'bigint' ||
        typeof args.transactionHash !== 'string' ||
        typeof args.contractAddress !== 'string' ||
        typeof args.signature !== 'string' ||
        typeof args.jsonRpcMethod !== 'string' ||
        typeof args.initialBlock !== 'bigint' ||
        typeof args.endBlock !== 'bigint' ||
        typeof args.disabled !== 'boolean'
    ) {
        throw new Error('Invalid FilterUpdated event args format')
    }

    const {
        filterId: evFilterId,
        filterType: evFilterType,
        transactionHash: evTransactionHash,
        contractAddress: evContractAddress,
        signature: evSignature,
        jsonRpcMethod: evJsonRpcMethod,
        initialBlock: evInitialBlock,
        endBlock: evEndBlock,
        disabled: evDisabled,
    } = args

    console.log(`\n✅ Filter updated successfully:`)
    console.log(`   Filter ID: ${evFilterId}`)
    console.log(`   Filter Type: ${evFilterType}`)
    console.log(`   Transaction Hash: ${evTransactionHash}`)
    console.log(`   Contract Address: ${evContractAddress}`)
    console.log(`   Signature: ${evSignature}`)
    console.log(`   JSON-RPC Method: ${evJsonRpcMethod}`)
    console.log(`   Initial Block: ${evInitialBlock}`)
    console.log(`   End Block: ${evEndBlock}`)
    console.log(`   Disabled: ${evDisabled}`)

    return {
        filterId: evFilterId,
        filterType: Number(evFilterType),
        transactionHash: evTransactionHash,
        contractAddress: evContractAddress,
        signature: evSignature,
        jsonRpcMethod: evJsonRpcMethod,
        initialBlock: evInitialBlock,
        endBlock: evEndBlock,
        disabled: evDisabled,
    }
}

/**
 * Update filter using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function updateFilterWithRawTransaction(
    hre: HardhatRuntimeEnvironment,
    clientFilteringAddress: string,
    filterParams: FilterParams,
    signatureProvider: ISignatureProvider
): Promise<UpdateFilterResult> {
    const { IClientFiltering__factory } =
        await import('../../../typechain-types')

    const contractInterface = IClientFiltering__factory.createInterface()

    const contractFilterData = {
        filterId: filterParams.filterId as BytesLike,
        filterType: filterParams.filterType as BigNumberish,
        transactionHash: filterParams.transactionHash as BytesLike,
        contractAddress: filterParams.contractAddress as AddressLike,
        signature: filterParams.signature as BytesLike,
        jsonRpcMethod: toBytes32(filterParams.jsonRpcMethod) as BytesLike,
        initialBlock: filterParams.initialBlock as BigNumberish,
        endBlock: filterParams.endBlock as BigNumberish,
        disabled: filterParams.disabled,
    }

    // Encode the updateFilter function call
    const functionData = contractInterface.encodeFunctionData('updateFilter', [
        contractFilterData,
    ])

    console.log('📡 Sending updateFilter raw transaction...')

    let txResponse
    try {
        // FIRST simulate tx to catch errors early and avoid gas costs
        await hre.ethers.provider.call({
            to: clientFilteringAddress,
            from: await signatureProvider.getAddress(),
            data: functionData,
        })

        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: clientFilteringAddress,
            data: functionData,
            gasLimit: 500000n, // Reasonable gas limit for updateFilter
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
            `Failed to submit updateFilter raw transaction: ${
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

    // Parse FilterUpdated event from the receipt
    const filterUpdatedEvent = receipt.logs
        .map((log) => {
            try {
                return contractInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === EVENT_NAME)

    if (!filterUpdatedEvent) {
        throw new Error(`${EVENT_NAME} event not found in transaction receipt`)
    }

    const args = filterUpdatedEvent.args

    if (
        typeof args.filterId !== 'string' ||
        typeof args.filterType !== 'bigint' ||
        typeof args.transactionHash !== 'string' ||
        typeof args.contractAddress !== 'string' ||
        typeof args.signature !== 'string' ||
        typeof args.jsonRpcMethod !== 'string' ||
        typeof args.initialBlock !== 'bigint' ||
        typeof args.endBlock !== 'bigint' ||
        typeof args.disabled !== 'boolean'
    ) {
        throw new Error('Invalid FilterUpdated event args format')
    }

    const {
        filterId: evFilterId,
        filterType: evFilterType,
        transactionHash: evTransactionHash,
        contractAddress: evContractAddress,
        signature: evSignature,
        jsonRpcMethod: evJsonRpcMethod,
        initialBlock: evInitialBlock,
        endBlock: evEndBlock,
        disabled: evDisabled,
    } = args

    console.log(`\n✅ Filter updated successfully:`)
    console.log(`   Filter ID: ${evFilterId}`)
    console.log(`   Filter Type: ${evFilterType}`)
    console.log(`   Transaction Hash: ${evTransactionHash}`)
    console.log(`   Contract Address: ${evContractAddress}`)
    console.log(`   Signature: ${evSignature}`)
    console.log(`   JSON-RPC Method: ${evJsonRpcMethod}`)
    console.log(`   Initial Block: ${evInitialBlock}`)
    console.log(`   End Block: ${evEndBlock}`)
    console.log(`   Disabled: ${evDisabled}`)

    return {
        filterId: evFilterId,
        filterType: Number(evFilterType),
        transactionHash: evTransactionHash,
        contractAddress: evContractAddress,
        signature: evSignature,
        jsonRpcMethod: evJsonRpcMethod,
        initialBlock: evInitialBlock,
        endBlock: evEndBlock,
        disabled: evDisabled,
    }
}
