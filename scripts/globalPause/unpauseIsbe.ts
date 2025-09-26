import { Signer } from 'ethers'
import { ISignatureProvider } from '../../tasks/deployment/providers/ISignatureProvider'
import { getIsbeFactory } from '../utils/getIsbeFactory'
import { getEvent } from '../utils/getEvent'
import { isValidBytesAndLength } from '../utils/validation'

/**
 * Unpause ISBE using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function unpauseIsbe(
    proxyAddress: string,
    factory: string,
    signatureProvider: ISignatureProvider
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    if (!isValidBytesAndLength(proxyAddress, 20))
        throw new Error('Invalid proxy address format : ' + proxyAddress)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for ISBE unpausing...`
    )

    const signer = await signatureProvider.getSigner()
    const globalIsbePause = await getIsbeFactory(factory, signer)

    console.log('📡 Sending unpauseIsbe transaction...')
    const tx = await globalIsbePause.unpauseIsbe(proxyAddress)

    console.log('⏳ Waiting for transaction to be mined...')
    const unpauseEvent = await getEvent('IsbeUnpaused', tx, globalIsbePause)

    const { proxyAddress: unpausedProxyAddress, account: account } =
        unpauseEvent.args

    return {
        unpausedProxyAddress,
        account,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function unpauseIsbeLegacy(
    proxyAddress: string,
    factory: string,
    signer: Signer
): Promise<{
    unpausedProxyAddress: string
    account: string
}> {
    console.warn(
        '⚠️  Using legacy unpauseIsbe - consider switching to signature provider version'
    )

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
