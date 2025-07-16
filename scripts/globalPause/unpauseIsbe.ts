import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'

export async function unpauseIsbe(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    const globalIsbePause = await getIsbeFactory(factory, signer)

    const tx = await globalIsbePause.unpauseIsbe(proxyAddress)

    const unpauseEvent = await getEvent('IsbeUnpaused', tx, globalIsbePause)

    const { proxyAddress: unpausedProxyAddress, account: account } =
        unpauseEvent.args

    return {
        unpausedProxyAddress,
        account,
    }
}
