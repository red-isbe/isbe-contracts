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
