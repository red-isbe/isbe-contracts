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
import { getBesuNodeManager } from '../../utils/getBesuNodeManager'
import { IBesuNodeManager } from '../../../typechain-types'
import { NodeDTOStructOutput } from '../../../typechain-types/contracts/client/besuNodeManager/IBesuNodeManager'

export async function getPaginatedValidators(
    besuNodeManagerAddress: string,
    state: number,
    pageSize: number,
    pageIndex: number,
    signer: Signer
): Promise<{ validators: NodeDTOStructOutput[] }> {
    if (!isValidBytesAndLength(besuNodeManagerAddress, 20))
        throw new Error('Invalid besu node manager address format.')

    const besuNodeManager = (await getBesuNodeManager(
        besuNodeManagerAddress,
        signer
    )) as IBesuNodeManager

    return {
        validators: await besuNodeManager.getPaginatedValidators(
            state,
            pageSize,
            pageIndex
        ),
    }
}
