import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

export async function grantRole(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signer: Signer
): Promise<{ role: string; account: string; sender: string }> {
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
