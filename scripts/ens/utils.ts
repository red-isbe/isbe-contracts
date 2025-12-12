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

async function loadEnsRegistryFactory() {
    const { EnsRegistryFacet__factory } = await import('../../typechain-types')
    return EnsRegistryFacet__factory
}

export async function getEnsRegistry(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const EnsRegistryFacet__factory = await loadEnsRegistryFactory()
    return EnsRegistryFacet__factory.connect(diamond, signerOrProvider)
}

export async function executeEnsWrite(
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const EnsRegistryFacet__factory = await loadEnsRegistryFactory()
    const curve = signatureProvider.getCurveType()
    const iface = EnsRegistryFacet__factory.createInterface()

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
    const contract = EnsRegistryFacet__factory.connect(
        diamond,
        signer
    ) as unknown as ContractWithMethods
    const tx = await contract[method](...args)
    console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    const receipt = await tx.wait()
    console.log(`   ✅ Transaction mined in block ${receipt?.blockNumber}`)
    return { hash: tx.hash, receipt }
}
