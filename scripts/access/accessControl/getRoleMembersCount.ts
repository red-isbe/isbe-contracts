import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function getRoleMembersCount(
    role: string,
    diamond: string,
    signer: Signer
): Promise<{ memberCount: string }> {
    if (!isValidBytesAndLength(role, 32))
        throw new Error('Invalid role format: ' + role)

    const accessControl = await getAccessControl(diamond, signer)
    const result = await accessControl.getRoleMembersCount(role)

    return {
        memberCount: result.toString(),
    }
}
