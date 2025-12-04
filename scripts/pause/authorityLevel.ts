import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from '../../tasks/index'
import { getPause } from '../utils/getPause'

export async function getAuthorityLevel(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string
): Promise<bigint> {
    console.log('📡 Querying authority level...')

    // Use signer to connect to the contract
    const signer = await signatureProvider.getSigner()

    const pauseContract = await getPause(diamond, signer)

    try {
        const level = await pauseContract.authorityLevel()

        console.log('✅ Authority level retrieved')

        return level
    } catch (error) {
        console.error('❌ Failed to retrieve authority level:', error)
        throw error
    }
}
