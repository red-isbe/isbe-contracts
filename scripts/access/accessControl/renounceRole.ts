import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Renounce role using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function renounceRole(
    roleToRenounce: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    account: string
    sender: string
}> {
    if (!isValidBytesAndLength(roleToRenounce, 32))
        throw new Error('Invalid role format: ' + roleToRenounce)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role renouncing...`
    )

    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending renounceRole transaction...')
    const tx = await accessControl.renounceRole(roleToRenounce)

    console.log('⏳ Waiting for transaction to be mined...')
    const revokeEvent = await getEvent('RoleRevoked', tx, accessControl)

    const { role, account, sender } = revokeEvent.args

    return {
        role,
        account,
        sender,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function renounceRoleLegacy(
    roleToRenounce: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    account: string
    sender: string
}> {
    console.warn(
        '⚠️  Using legacy renounceRole - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToRenounce, 32))
        throw new Error('Invalid role format: ' + roleToRenounce)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.renounceRole(roleToRenounce)
    const revokeEvent = await getEvent('RoleRevoked', tx, accessControl)

    const { role, account, sender } = revokeEvent.args

    return {
        role,
        account,
        sender,
    }
}
