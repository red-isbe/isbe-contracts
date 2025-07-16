import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

export async function renounceRole(
    roleToRenounce: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    account: string
    sender: string
}> {
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
