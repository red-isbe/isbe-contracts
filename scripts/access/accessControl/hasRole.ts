import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function hasRole(
    role: string,
    account: string,
    diamond: string,
    signer: Signer
): Promise<{ hasRole: boolean }> {
    if (!isValidBytesAndLength(role, 32))
        throw new Error('Invalid role format: ' + role)
    if (!isValidBytesAndLength(account, 20))
        throw new Error('Invalid account format: ' + account)

    const accessControl = await getAccessControl(diamond, signer)
    const result = await accessControl.hasRole(role, account)

    return {
        hasRole: result,
    }
}
