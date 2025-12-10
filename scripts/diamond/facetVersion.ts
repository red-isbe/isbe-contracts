import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ISignatureProvider } from '../../tasks/index'
import { getDiamondLoupe } from '../utils/getDiamondLoupe'

export async function getFacetVersion(
    hre: HardhatRuntimeEnvironment,
    signatureProvider: ISignatureProvider,
    diamond: string,
    facetKey: string
): Promise<bigint> {
    console.log('📡 Querying facet version...')

    // Use signer to connect to the contract
    const signer = await signatureProvider.getSigner()

    const loupeContract = await getDiamondLoupe(diamond, signer)

    try {
        const version = await loupeContract.facetVersion(facetKey)

        console.log('✅ Facet version retrieved')

        return version
    } catch (error) {
        console.error('❌ Failed to retrieve facet version:', error)
        throw error
    }
}
