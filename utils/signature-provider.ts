import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { SignatureProviderFactory } from '../tasks/deployment/providers/SignatureProviderFactory'
import type { ISignatureProvider } from '../tasks/deployment/providers/ISignatureProvider'

export async function getSignatureProvider(
    hre: HardhatRuntimeEnvironment
): Promise<ISignatureProvider> {
    return SignatureProviderFactory.create(hre)
}
