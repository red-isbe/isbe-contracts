import { Signer } from 'ethers'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'

export async function getRoleAdmin(
    role: string,
    diamond: string,
    signer: Signer
): Promise<{ roleAdmin: string }> {
    if (!isValidBytesAndLength(role, 32))
        throw new Error('Invalid role format: ' + role)

    const accessControl = await getAccessControl(diamond, signer)
    const result = await accessControl.getRoleAdmin(role)

    return {
        roleAdmin: result,
    }
}
