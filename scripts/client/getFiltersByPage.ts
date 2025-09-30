import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../utils/validation'
import { getClientFiltering } from '../utils/getClientFiltering'
import { IClientFiltering } from '../../typechain-types'

export async function getFiltersByPage(
    pageNumber: number,
    pageSize: number,
    clientFilteringAddress: string,
    signer: Signer
): Promise<{
    filters: IClientFiltering.FilterStructOutput[]
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

    const result = await clientFiltering.getFiltersByPage(pageNumber, pageSize)

    return {
        filters: result,
    }
}
