import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'

export async function pauseIsbe(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    pausedProxyAddress: string
    account: string
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)
    const globalIsbePause = await getIsbeFactory(factory, signer)

    const tx = await globalIsbePause.pauseIsbe(proxyAddress)

    const pauseEvent = await getEvent('IsbePaused', tx, globalIsbePause)

    const { proxyAddress: pausedProxyAddress, account: account } =
        pauseEvent.args

    return {
        pausedProxyAddress,
        account,
    }
}
