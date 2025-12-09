import { ISignatureProvider } from '../../../tasks/index'
import { getAnchorCore } from '../../../scripts/utils/getAnchorCore'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function isBlockAnchored(
    hre: HardhatRuntimeEnvironment,
    governancediamond: string,
    chainid: string,
    blocknumber: string,
    signatureProvider: ISignatureProvider
): Promise<boolean> {
    console.log('📡 Checking if block is anchored...')

    // Use signer for read operations
    const signer = await signatureProvider.getSigner()
    const anchoringCoreFacet = await getAnchorCore(governancediamond, signer)

    const chainIdNum = Number(chainid)
    const blockNumberNum = Number(blocknumber)

    try {
        const result = await anchoringCoreFacet.isBlockAnchored(
            chainIdNum,
            blockNumberNum
        )

        console.log(
            `✅ Block ${blocknumber} on chain ${chainid} is ${result ? 'ANCHORED' : 'NOT ANCHORED'}`
        )

        return result
    } catch (error) {
        console.error('❌ Failed to check if block is anchored:', error)
        throw error
    }
}
