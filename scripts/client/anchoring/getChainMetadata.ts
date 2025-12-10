import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface ChainMetadataDTO {
    thisChainId: bigint
    registeredChainIds: bigint[]
}

export async function getChainMetadata(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    signatureProvider: ISignatureProvider
): Promise<ChainMetadataDTO> {
    console.log('📡 Querying chain metadata...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    try {
        const result = await anchoringCoreFacet.getChainMetadata()

        console.log('✅ Chain metadata retrieved')
        console.log(`   This Chain ID: ${result._thisChainId}`)
        console.log(
            `   Registered Chains: ${result._registeredChainIds.length} chain(s)`
        )

        return {
            thisChainId: result._thisChainId,
            registeredChainIds: result._registeredChainIds,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve chain metadata:', error)
        throw error
    }
}
