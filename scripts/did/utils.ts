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
import { Provider, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'

type ContractWithMethods = Record<
    string,
    (
        ...args: unknown[]
    ) => Promise<{ hash: string; wait: () => Promise<unknown> }>
>

type FacetFactory = {
    createInterface: () => {
        encodeFunctionData: (method: string, args: unknown[]) => string
    }
    connect: (
        address: string,
        signerOrProvider: Signer | Provider
    ) => ContractWithMethods
}

async function loadDidRegistryQueryFactory() {
    const { DidRegistryQueryFacet__factory } =
        await import('../../typechain-types')
    return DidRegistryQueryFacet__factory
}

async function loadDidControllerFactory() {
    const { DidControllerFacet__factory } =
        await import('../../typechain-types')
    return DidControllerFacet__factory
}

async function loadDidVerificationMethodFactory() {
    const { DidVerificationMethodFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationMethodFacet__factory
}

async function loadDidVerificationRelationshipFactory() {
    const { DidVerificationRelationshipFacet__factory } =
        await import('../../typechain-types')
    return DidVerificationRelationshipFacet__factory
}

export async function getDidRegistryQuery(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const DidRegistryQueryFacet__factory = await loadDidRegistryQueryFactory()
    return DidRegistryQueryFacet__factory.connect(diamond, signerOrProvider)
}

export async function getDidController(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const DidControllerFacet__factory = await loadDidControllerFactory()
    return DidControllerFacet__factory.connect(diamond, signerOrProvider)
}

export async function getDidVerificationMethod(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const DidVerificationMethodFacet__factory =
        await loadDidVerificationMethodFactory()
    return DidVerificationMethodFacet__factory.connect(
        diamond,
        signerOrProvider
    )
}

export async function getDidVerificationRelationship(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const DidVerificationRelationshipFacet__factory =
        await loadDidVerificationRelationshipFactory()
    return DidVerificationRelationshipFacet__factory.connect(
        diamond,
        signerOrProvider
    )
}

export async function executeDidWrite(
    factory: FacetFactory,
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const curve = signatureProvider.getCurveType()
    const iface = factory.createInterface()

    if (curve === 'secp256r1') {
        const data = iface.encodeFunctionData(method, args)
        console.log(`📡 Sending ${method} raw transaction...`)
        const txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data,
            gasLimit,
        })
        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
        const receipt = await txResponse.wait()
        console.log(`   ✅ Transaction mined in block ${receipt?.blockNumber}`)
        return { hash: txResponse.hash, receipt }
    }

    const signer = await signatureProvider.getSigner()
    const contract = factory.connect(diamond, signer)

    // Validate method exists
    if (typeof contract[method] !== 'function') {
        throw new Error(`Method '${method}' does not exist on contract`)
    }

    try {
        const tx = gasLimit
            ? await contract[method](...args, { gasLimit })
            : await contract[method](...args)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
        const receipt = await tx.wait()
        console.log(`   ✅ Transaction mined in block ${receipt?.blockNumber}`)
        return { hash: tx.hash, receipt }
    } catch (error) {
        console.error(`   ❌ Transaction failed for method '${method}':`, error)
        throw error
    }
}
