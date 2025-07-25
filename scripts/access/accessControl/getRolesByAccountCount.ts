import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function getRolesByAccountCount(
    account: string,
    diamond: string,
    signer: Signer
): Promise<{ rolesCount: string }> {
    if (!isValidBytesAndLength(account, 20))
        throw new Error('Invalid account format: ' + account)

    const accessControl = await getAccessControl(diamond, signer)
    const result = await accessControl.getRolesByAccountCount(account)

    return {
        rolesCount: result.toString(),
    }
}
