import { getIsbeFactory } from '../utils/getIsbeFactory'
import { isValidBytesAndLength } from '../utils/validation'
import { ISignatureProvider } from '../../tasks/index'

export async function getFacetSupportsInterface(
    hre: unknown,
    diamond: string,
    signatureProvider: ISignatureProvider,
    configId: string,
    configVersion: number,
    interfaceId: string
): Promise<boolean> {
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const signer = await signatureProvider.getSigner()

    const configManagement = await getIsbeFactory(diamond, signer)

    const result = await configManagement.facetSupportsInterface(
        configId,
        configVersion,
        interfaceId
    )

    return result
}
