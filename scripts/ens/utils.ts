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
