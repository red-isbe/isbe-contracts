import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

export async function setRoleAdmin(
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
