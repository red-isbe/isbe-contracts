import { Signer } from 'ethers'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

export async function pause(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    const pause = await getPause(diamond, signer)

    const tx = await pause.pause()

    const pauseEvent = await getEvent('Paused', tx, pause)

    const { account: account } = pauseEvent.args

    return {
        account,
    }
}
