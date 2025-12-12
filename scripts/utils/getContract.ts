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
import { type ContractRunner, Signer } from 'ethers'
import { isValidBytesAndLength } from './validation'

type Factory<T> = {
    connect: (address: string, signerOrProvider?: ContractRunner | null) => T
}

export async function getContract<T>(
    factoryType: Factory<T>,
    address: string,
    signer: Signer
) {
    if (!isValidBytesAndLength(address, 20))
        throw new Error('Invalid contract address format : ' + address)

    return factoryType.connect(address, signer)
}
