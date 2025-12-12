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
import { toBigInt } from 'ethers'

export async function getContractStorageSlots(
    contractAddress: string,
    start: string,
    end: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hre: any
): Promise<string[]> {
    if (!isValidBytesAndLength(start, 32))
        throw new Error('Invalid start format : ' + start)

    if (!isValidBytesAndLength(end, 32))
        throw new Error('Invalid end format : ' + end)

    if (!isValidBytesAndLength(contractAddress, 20))
        throw new Error('Invalid contract address format : ' + contractAddress)

    const startBI = toBigInt(start)
    const endBI = toBigInt(end)

    if (endBI < startBI) {
        throw new Error('End slot must be greater than or equal to start slot.')
    }

    const slots: string[] = []
    for (let slot = startBI; slot <= endBI; slot++) {
        const hexSlot = `0x${slot.toString(16).padStart(64, '0')}`

        console.log(hexSlot)

        const value = await hre.network.provider.send('eth_getStorageAt', [
            contractAddress,
            hexSlot,
            'latest',
        ])

        console.log(value)
        slots.push(value)
    }

    return slots
}
