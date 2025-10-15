import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../utils/validation'
import { getClientFiltering } from '../utils/getClientFiltering'
import { IClientFiltering } from '../../typechain-types'

export async function isFilterRegistered(
    filterId: string,
    clientFilteringAddress: string,
    signer: Signer
): Promise<{
    registered: boolean
}> {
    if (!isValidBytesAndLength(clientFilteringAddress, 20))
        throw new Error(
            'Invalid client filtering address format : ' +
                clientFilteringAddress
        )

    const clientFiltering = (await getClientFiltering(
        clientFilteringAddress,
        signer
    )) as IClientFiltering

    const result = await clientFiltering.isFilterRegistered(filterId)

    return {
        registered: result,
    }
}
