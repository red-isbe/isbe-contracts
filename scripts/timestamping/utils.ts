import { Provider, Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'

type ContractWithMethods = Record<
    string,
    (
        ...args: unknown[]
    ) => Promise<{ hash: string; wait: () => Promise<unknown> }>
>

async function loadTimeStampingRegistryFactory() {
    const { TimeStampingRegistryFacet__factory } =
        await import('../../typechain-types')
    return TimeStampingRegistryFacet__factory
}

export async function getTimeStampingRegistry(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const TimeStampingRegistryFacet__factory =
        await loadTimeStampingRegistryFactory()
    return TimeStampingRegistryFacet__factory.connect(diamond, signerOrProvider)
}

export async function executeTimeStampingWrite(
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const TimeStampingRegistryFacet__factory =
        await loadTimeStampingRegistryFactory()
    const curve = signatureProvider.getCurveType()
    const iface = TimeStampingRegistryFacet__factory.createInterface()

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
    const contract = TimeStampingRegistryFacet__factory.connect(
        diamond,
        signer
    ) as unknown as ContractWithMethods
    const tx = gasLimit
        ? await contract[method](...args, { gasLimit })
        : await contract[method](...args)
    console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    const receipt = await tx.wait()
    console.log(`   ✅ Transaction mined in block ${receipt?.blockNumber}`)
    return { hash: tx.hash, receipt }
}
