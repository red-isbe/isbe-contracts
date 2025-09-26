import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Grant role using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function grantRole(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    if (!isValidBytesAndLength(roleToGrant, 32))
        throw new Error('Invalid role format: ' + roleToGrant)
    if (!isValidBytesAndLength(accountToGrantTo, 20))
        throw new Error('Invalid account format: ' + accountToGrantTo)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role granting...`
    )

    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending grantRole transaction...')
    const tx = await accessControl.grantRole(roleToGrant, accountToGrantTo)

    console.log('⏳ Waiting for transaction to be mined...')
    const grantRoleEvent = await getEvent('RoleGranted', tx, accessControl)

    const { role, account, sender } = grantRoleEvent.args

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
export async function grantRoleLegacy(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signer: Signer
): Promise<{ role: string; account: string; sender: string }> {
    console.warn(
        '⚠️  Using legacy grantRole - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToGrant, 32))
        throw new Error('Invalid role format: ' + roleToGrant)
    if (!isValidBytesAndLength(accountToGrantTo, 20))
        throw new Error('Invalid account format: ' + accountToGrantTo)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.grantRole(roleToGrant, accountToGrantTo)
    const grantRoleEvent = await getEvent('RoleGranted', tx, accessControl)

    const { role, account, sender } = grantRoleEvent.args

    return {
        role,
        account,
        sender,
    }
}
