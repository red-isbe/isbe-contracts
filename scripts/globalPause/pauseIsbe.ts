import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'

/**
 * Pause ISBE using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function pauseIsbe(
    proxyAddress: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    pausedProxyAddress: string
    account: string
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for ISBE pausing...`
    )

    const signer = await signatureProvider.getSigner()
    const globalIsbePause = await getIsbeFactory(factory, signer)

    console.log('📡 Sending pauseIsbe transaction...')
    const tx = await globalIsbePause.pauseIsbe(proxyAddress)

    console.log('⏳ Waiting for transaction to be mined...')
    const pauseEvent = await getEvent('IsbePaused', tx, globalIsbePause)

    const { proxyAddress: pausedProxyAddress, account: account } =
        pauseEvent.args

    return {
        pausedProxyAddress,
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function pauseIsbeLegacy(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    pausedProxyAddress: string
    account: string
}> {
    console.warn(
        '⚠️  Using legacy pauseIsbe - consider switching to signature provider version'
    )

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
