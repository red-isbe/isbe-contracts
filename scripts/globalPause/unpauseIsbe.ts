// For ethers v6:
import { Signer } from 'ethers'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'

export async function unpauseIsbe(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    unpausedProxyAddress: string
}> {
    const globalIsbePause = await getIsbeFactory(factory, signer)

    const tx = await globalIsbePause.unpauseIsbe(proxyAddress)

    const unpauseEvent = await getEvent('IsbeUnpaused', tx, globalIsbePause)

    const { proxyAddress: unpausedProxyAddress } = unpauseEvent.args

    return {
        unpausedProxyAddress,
    }
}
