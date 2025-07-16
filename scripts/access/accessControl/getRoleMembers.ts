import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function getRoleMembers(
    role: string,
    diamond: string,
    signer: Signer
): Promise<{ members: string[] }> {
    if (!isValidBytesAndLength(role, 32))
        throw new Error('Invalid role format: ' + role)

    const accessControl = await getAccessControl(diamond, signer)

    const count = await accessControl.getRoleMembersCount(role)
    const members: string[] = []

    for (let i = 0; i < count; i++) {
        const result = await accessControl.getRoleMembers(role, i, 1)
        members.push(result[0])
    }

    return {
        members,
    }
}
