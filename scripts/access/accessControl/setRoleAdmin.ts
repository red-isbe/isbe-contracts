import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Set role admin using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function setRoleAdmin(
    roleToUpdate: string,
    adminRole: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    previousAdminRole: string
    newAdminRole: string
    sender: string
}> {
    if (!isValidBytesAndLength(roleToUpdate, 32))
        throw new Error('Invalid role format: ' + roleToUpdate)
    if (!isValidBytesAndLength(adminRole, 32))
        throw new Error('Invalid admin role format: ' + adminRole)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for setting role admin...`
    )

    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending setRoleAdmin transaction...')
    const tx = await accessControl.setRoleAdmin(roleToUpdate, adminRole)

    console.log('⏳ Waiting for transaction to be mined...')
    const setRoleAdminEvent = await getEvent(
        'RoleAdminChanged',
        tx,
        accessControl
    )

    const { role, previousAdminRole, newAdminRole, sender } =
        setRoleAdminEvent.args

    return {
        role,
        previousAdminRole,
        newAdminRole,
        sender,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function setRoleAdminLegacy(
    roleToUpdate: string,
    adminRole: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    previousAdminRole: string
    newAdminRole: string
    sender: string
}> {
    console.warn(
        '⚠️  Using legacy setRoleAdmin - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToUpdate, 32))
        throw new Error('Invalid role format: ' + roleToUpdate)
    if (!isValidBytesAndLength(adminRole, 32))
        throw new Error('Invalid admin role format: ' + adminRole)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.setRoleAdmin(roleToUpdate, adminRole)
    const setRoleAdminEvent = await getEvent(
        'RoleAdminChanged',
        tx,
        accessControl
    )

    const { role, previousAdminRole, newAdminRole, sender } =
        setRoleAdminEvent.args

    return {
        role,
        previousAdminRole,
        newAdminRole,
        sender,
    }
}
