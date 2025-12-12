import { ethers, Signer, Provider } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'

type ContractWithMethods = Record<
    string,
    (
        ...args: unknown[]
    ) => Promise<{ hash: string; wait: () => Promise<unknown> }>
>

async function loadNetworkDirectoryFactory() {
    const { NetworkDirectoryFacet__factory } =
        await import('../../../typechain-types')
    return NetworkDirectoryFacet__factory
}

export function stringToBytes32(value: string): string {
    if (value.startsWith('0x') && value.length === 66) {
        return value
    }
    return ethers.encodeBytes32String(value.slice(0, 31))
}

export function bytes32ToString(bytes32: string): string {
    try {
        return ethers.decodeBytes32String(bytes32)
    } catch {
        return bytes32
    }
}

export function algorithmToString(algorithm: number): string {
    const algorithms = ['NONE', 'SECP256K1', 'SECP256R1']
    return algorithms[algorithm] || 'UNKNOWN'
}

export function stageToString(stage: number): string {
    const stages = ['NONE', 'DEV', 'PRE', 'PROD']
    return stages[stage] || 'UNKNOWN'
}

export async function getNetworkDirectory(
    diamond: string,
    signerOrProvider: Signer | Provider
) {
    const NetworkDirectoryFacet__factory = await loadNetworkDirectoryFactory()
    return NetworkDirectoryFacet__factory.connect(diamond, signerOrProvider)
}

export async function executeNetworkDirectoryWrite(
    diamond: string,
    signatureProvider: ISignatureProvider,
    method: string,
    args: unknown[],
    gasLimit?: bigint
) {
    const NetworkDirectoryFacet__factory = await loadNetworkDirectoryFactory()
    const curve = signatureProvider.getCurveType()
    const iface = NetworkDirectoryFacet__factory.createInterface()

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
    const contract = NetworkDirectoryFacet__factory.connect(
        diamond,
        signer
    ) as unknown as ContractWithMethods
    const tx = await contract[method](...args)
    console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    const receipt = await tx.wait()
    console.log(`   ✅ Transaction mined in block ${receipt?.blockNumber}`)
    return { hash: tx.hash, receipt }
}
