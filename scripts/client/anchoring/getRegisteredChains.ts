import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export interface RegisteredChainsDTO {
    thisChainId: bigint
    registeredChainIds: bigint[]
}

export async function getRegisteredChains(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    pageindex: string,
    pagelength: string,
    signatureProvider: ISignatureProvider
): Promise<RegisteredChainsDTO> {
    console.log('📡 Querying registered chains...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const pageIndexNum = Number(pageindex)
    const pageLengthNum = Number(pagelength)

    try {
        const result = await anchoringCoreFacet.getRegisteredChains(
            pageIndexNum,
            pageLengthNum
        )

        console.log(`✅ Retrieved registered chains`)
        console.log(`   This Chain ID: ${result._thisChainId}`)
        console.log(
            `   Registered Chains: ${result._registeredChainIds.length}`
        )
        console.log(`   Page: ${pageIndexNum}, Length: ${pageLengthNum}`)

        return {
            thisChainId: result._thisChainId,
            registeredChainIds: result._registeredChainIds,
        }
    } catch (error) {
        console.error('❌ Failed to retrieve registered chains:', error)
        throw error
    }
}
