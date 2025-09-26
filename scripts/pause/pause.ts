import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

/**
 * Pause using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function pause(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for pausing...`
    )

    const signer = await signatureProvider.getSigner()
    const pause = await getPause(diamond, signer)

    console.log('📡 Sending pause transaction...')
    const tx = await pause.pause()

    console.log('⏳ Waiting for transaction to be mined...')
    const pauseEvent = await getEvent('Paused', tx, pause)

    const { account: account } = pauseEvent.args

    return {
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function pauseLegacy(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    console.warn(
        '⚠️  Using legacy pause - consider switching to signature provider version'
    )

    const pause = await getPause(diamond, signer)
    const tx = await pause.pause()
    const pauseEvent = await getEvent('Paused', tx, pause)

    const { account: account } = pauseEvent.args

    return {
        account,
    }
}
