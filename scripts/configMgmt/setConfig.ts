import { BigNumberish, Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'
import { BusinessData } from './interfaces'

export async function setConfig(
    configId: string,
    businessIds: string[],
    versions: number[],
    factory: string,
    signer: Signer
): Promise<{
    configurationId: string
    businessData: BusinessData[]
    version: BigNumberish
}> {
    if (businessIds.length != versions.length)
        throw Error('business Ids and versions length not the same')
    if (!isValidBytesAndLength(configId, 32))
        throw new Error('Invalid configuration Id format : ' + configId)

    const configManagement = await getIsbeFactory(factory, signer)

    const businessDataInput: BusinessData[] = []

    for (let i = 0; i < businessIds.length; i++) {
        if (!isValidBytesAndLength(businessIds[i], 32))
            throw new Error('Invalid business id format : ' + businessIds[i])

        businessDataInput.push({
            businessId: businessIds[i],
            version: versions[i],
        })
    }

    const tx = await configManagement.setConfiguration(
        configId,
        businessDataInput
    )

    const setConfigEvent = await getEvent(
        'ConfigurationSet',
        tx,
        configManagement
    )

    const { configurationId, businessData, version } = setConfigEvent.args

    return {
        configurationId,
        businessData,
        version: version.toString(),
    }
}
