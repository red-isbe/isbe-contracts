import type { ContractTransactionResponse, BaseContract } from 'ethers'

export async function getEvent(
    eventName: string,
    tx: ContractTransactionResponse,
    contract: BaseContract
) {
    const receipt = await tx.wait()

    if (!receipt) {
        throw new Error('Transaction receipt is null')
    }

    let event = null
    for (const log of receipt.logs) {
        try {
            const parsed = contract.interface.parseLog(log)
            if (parsed && parsed.name === eventName) {
                event = parsed
                break
            }
        } catch (e) {
            throw new Error(`Error parsing through logs : ${e}`)
        }
    }

    if (!event) {
        throw new Error(`${eventName} event not found in transaction receipt`)
    }

    return event
}
