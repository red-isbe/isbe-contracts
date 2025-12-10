import { ISignatureProvider } from '../../tasks/index'
import { getIsbeFactory } from '../../scripts/utils/getIsbeFactory'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getDeployedProxiesByConfiguration(
    hre: HardhatRuntimeEnvironment,
    diamond: string,
    signatureProvider: ISignatureProvider,
    configurationId: string,
    version: number
): Promise<string[]> {
    console.log('📡 Querying deployed proxies by configuration...')

    const signer = await signatureProvider.getSigner()
    const isbeFactory = await getIsbeFactory(diamond, signer)

    try {
        const proxies = await isbeFactory.getDeployedProxiesByConfiguration(
            configurationId,
            version
        )

        if (!proxies || proxies.length === 0) {
            console.log(
                '⚠️  No proxies found for the given configuration and version'
            )
            return []
        }

        console.log(`✅ Found ${proxies.length} deployed proxy(ies)`)

        return proxies
    } catch (error) {
        console.error('❌ Failed to retrieve deployed proxies:', error)
        throw error
    }
}
