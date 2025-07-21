import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

export async function revokeRole(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    account: string
    sender: string
}> {
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
