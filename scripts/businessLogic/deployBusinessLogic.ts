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
import { BigNumberish, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytes, isValidBytesAndLength } from '../utils/validation'

/**
 * Deploy business logic using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function deployBusinessLogic(
    businessId: string,
    bytecode: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    if (!isValidBytes(bytecode))
        throw new Error('Invalid byte code format : ' + bytecode)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for business logic deployment...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await deployBusinessLogicWithRawTransaction(
            businessId,
            bytecode,
            factory,
            signatureProvider
        )
    }

    const signer = await signatureProvider.getSigner()
    // For secp256k1, use the standard contract interface
    const businessLogicFactory = await getIsbeFactory(factory, signer)

    console.log('📡 Sending deployBusinessLogic transaction...')
    // Add explicit gas limit to prevent "Internal error" on non-validator nodes
    const tx = await businessLogicFactory.deploy(businessId, bytecode, {
        gasLimit: 25_000_000, // Set high gas limit for contract deployment
    })

    console.log('⏳ Waiting for transaction to be mined...')
    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}

/**
 * Deploy business logic using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function deployBusinessLogicWithRawTransaction(
    businessId: string,
    bytecode: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    // Import BusinessLogicFactory interface for encoding function data
    const { BusinessLogicFactoryFacet__factory } =
        await import('../../typechain-types')

    // Create interface for encoding function data
    const factoryInterface =
        BusinessLogicFactoryFacet__factory.createInterface()

    // Encode the deploy function call
    const functionData = factoryInterface.encodeFunctionData('deploy', [
        businessId,
        bytecode,
    ])

    console.log('📡 Sending deployBusinessLogic raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: factory,
            data: functionData,
            gasLimit: 3000000n, // Higher gas limit for deployment
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit deployBusinessLogic raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse Deployed event from the receipt
    const deployedEvent = receipt.logs
        .map((log) => {
            try {
                return factoryInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === 'Deployed')

    if (!deployedEvent) {
        throw new Error('Deployed event not found in transaction receipt')
    }

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function deployBusinessLogicLegacy(
    businessId: string,
    bytecode: string,
    factory: string,
    signer: Signer
): Promise<{
    businessId: string
    businessAddress: string
    version: BigNumberish
}> {
    console.warn(
        '⚠️  Using legacy deployBusinessLogic - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(businessId, 32))
        throw new Error('Invalid business Id format : ' + businessId)

    if (!isValidBytes(bytecode))
        throw new Error('Invalid byte code format : ' + bytecode)

    const businessLogicFactory = await getIsbeFactory(factory, signer)
    // Add explicit gas limit to prevent "Internal error" on non-validator nodes
    const tx = await businessLogicFactory.deploy(businessId, bytecode, {
        gasLimit: 25_000_000, // Set high gas limit for contract deployment
    })
    const deployedEvent = await getEvent('Deployed', tx, businessLogicFactory)

    const {
        businessId: deployedBusinessId,
        businessAddress,
        version,
    } = deployedEvent.args

    return {
        businessId: deployedBusinessId,
        businessAddress,
        version: version.toString(),
    }
}
