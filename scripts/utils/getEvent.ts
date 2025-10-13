import type { ContractTransactionResponse, BaseContract } from 'ethers'
import { TransactionError, getErrorMessage } from '../../utils/errors'
import { validateRequired, validateNonEmpty } from './validation'

/**
 * Extracts and returns a specific event from a transaction receipt
 *
 * @param eventName - Name of the event to extract
 * @param tx - Transaction response containing the receipt
 * @param contract - Contract instance for parsing logs
 * @returns The parsed event log
 * @throws {ValidationError} When required parameters are invalid
 * @throws {TransactionError} When transaction or event parsing fails
 *
 * @example
 * ```typescript
 * const event = await getEvent('Transfer', transferTx, erc20Contract)
 * console.log('Transfer event:', event.args)
 * ```
 */
export async function getEvent(
    eventName: string,
    tx: ContractTransactionResponse,
    contract: BaseContract
) {
    // Validate inputs
    validateRequired(eventName, 'eventName')
    validateNonEmpty(eventName, 'eventName')
    validateRequired(tx, 'transaction')
    validateRequired(contract, 'contract')

    let receipt
    try {
        receipt = await tx.wait()
    } catch (error) {
        throw TransactionError.withContext(
            `Failed to wait for transaction: ${getErrorMessage(error)}`,
            tx.hash,
            0
        )
    }

    if (!receipt) {
        throw new TransactionError(
            'Transaction receipt is null - transaction may have failed',
            tx.hash
        )
    }

    let event = null
    const parseErrors: string[] = []

    for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i]
        try {
            const parsed = contract.interface.parseLog(log)
            if (parsed && parsed.name === eventName) {
                event = parsed
                break
            }
        } catch (error) {
            // Collect parse errors but don't fail immediately
            // Some logs might be from other contracts
            parseErrors.push(`Log ${i}: ${getErrorMessage(error)}`)
        }
    }

    if (!event) {
        const errorMessage =
            parseErrors.length > 0
                ? `Event '${eventName}' not found in transaction receipt. Parse errors encountered: ${parseErrors.join('; ')}`
                : `Event '${eventName}' not found in transaction receipt. No matching events found in ${receipt.logs.length} logs.`

        throw TransactionError.withContext(
            errorMessage,
            tx.hash,
            receipt.blockNumber
        )
    }

    return event
}
