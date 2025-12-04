import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'

export async function getFacetSupportsInterface(
    configId: string,
    version: number,
    interfaceId: string,
    diamond: string,
    signer: Signer
): Promise<boolean> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(diamond, signer)

    const result = await configManagement.facetSupportsInterface(
        configId,
        version,
        interfaceId
    )

    return result
}
