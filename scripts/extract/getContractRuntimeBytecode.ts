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
import { isValidBytesAndLength } from '../utils/validation'

export async function getContractRuntimeBytecode(
    contractAddress: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any
): Promise<string> {
    if (!isValidBytesAndLength(contractAddress, 20))
        throw new Error('Invalid contract address format : ' + contractAddress)

    const bytecode = await hre.ethers.provider.getCode(contractAddress)
    if (!bytecode || bytecode === '0x') {
        throw new Error(`No contract found at address: ${contractAddress}`)
    }
    return bytecode
}
