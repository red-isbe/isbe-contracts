import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function getRolesByAccount(
    account: string,
    diamond: string,
    signer: Signer
): Promise<{ roles: string[] }> {
    if (!isValidBytesAndLength(account, 20))
        throw new Error('Invalid account format: ' + account)

    const accessControl = await getAccessControl(diamond, signer)

    const count = await accessControl.getRolesByAccountCount(account)
    const roles: string[] = []

    for (let i = 0; i < count; i++) {
        const result = await accessControl.getRolesByAccount(account, i, 1)
        roles.push(result[0])
    }

    return {
        roles,
    }
}
