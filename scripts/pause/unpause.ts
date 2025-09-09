import { Signer } from 'ethers'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

export async function unpause(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    const pause = await getPause(diamond, signer)

    const tx = await pause.unpause()

    const unpauseEvent = await getEvent('Unpaused', tx, pause)

    const { account: account } = unpauseEvent.args

    return {
        account,
    }
}
