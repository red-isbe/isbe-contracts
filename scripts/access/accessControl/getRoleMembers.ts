/* -----------------------------------------------------------------------------------
Copyright (c) 2025 Comunidad de Madrid & Alastria
Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
----------------------------------------------------------------------------------- */
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
