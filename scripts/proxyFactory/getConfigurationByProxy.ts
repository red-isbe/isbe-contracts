import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getConfigurationByProxy(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    configurationId: string
    version: number
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    const proxyFactory = await getIsbeFactory(factory, signer)

    const result = await proxyFactory.getConfigurationByProxy(proxyAddress)

    return {
        configurationId: result.configurationId,
        version: parseInt(result.version.toString()),
    }
}
