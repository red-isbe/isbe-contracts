import { Signer } from 'ethers'
import { getPause } from '../utils/getPause'

export async function isPaused(
    diamond: string,
    signer: Signer
): Promise<{
    isPaused: boolean
}> {
    const pause = await getPause(diamond, signer)

    const result = await pause.paused()

    return {
        isPaused: result,
    }
}
