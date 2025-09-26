import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getPause } from '../utils/getPause'
import { getEvent } from '../utils/getEvent'

/**
 * Unpause using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function unpause(
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    account: string
}> {
    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for unpausing...`
    )

    const signer = await signatureProvider.getSigner()
    const pause = await getPause(diamond, signer)

    console.log('📡 Sending unpause transaction...')
    const tx = await pause.unpause()

    console.log('⏳ Waiting for transaction to be mined...')
    const unpauseEvent = await getEvent('Unpaused', tx, pause)

    const { account: account } = unpauseEvent.args

    return {
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function unpauseLegacy(
    diamond: string,
    signer: Signer
): Promise<{
    account: string
}> {
    console.warn(
        '⚠️  Using legacy unpause - consider switching to signature provider version'
    )

    const pause = await getPause(diamond, signer)
    const tx = await pause.unpause()
    const unpauseEvent = await getEvent('Unpaused', tx, pause)

    const { account: account } = unpauseEvent.args

    return {
        account,
    }
}
