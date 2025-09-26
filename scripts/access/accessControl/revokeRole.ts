import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Revoke role using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function revokeRole(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    account: string
    sender: string
}> {
    if (!isValidBytesAndLength(roleToRevoke, 32))
        throw new Error('Invalid role format: ' + roleToRevoke)
    if (!isValidBytesAndLength(accountToRevokeFrom, 20))
        throw new Error('Invalid account format: ' + accountToRevokeFrom)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role revoking...`
    )

    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending revokeRole transaction...')
    const tx = await accessControl.revokeRole(roleToRevoke, accountToRevokeFrom)

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
export async function revokeRoleLegacy(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    account: string
    sender: string
}> {
    console.warn(
        '⚠️  Using legacy revokeRole - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToRevoke, 32))
        throw new Error('Invalid role format: ' + roleToRevoke)
    if (!isValidBytesAndLength(accountToRevokeFrom, 20))
        throw new Error('Invalid account format: ' + accountToRevokeFrom)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.revokeRole(roleToRevoke, accountToRevokeFrom)
    const revokeEvent = await getEvent('RoleRevoked', tx, accessControl)

    const { role, account, sender } = revokeEvent.args

    return {
        role,
        account,
        sender,
    }
}
