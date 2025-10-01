import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

interface EnhancedError extends Error {
    originalError: unknown
    context?: {
        operation: string
        role: string
        account: string
        contract: string
    }
    transactionHash?: string
}

/**
 * Grant role using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function grantRole(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    if (!isValidBytesAndLength(roleToGrant, 32))
        throw new Error('Invalid role format: ' + roleToGrant)
    if (!isValidBytesAndLength(accountToGrantTo, 20))
        throw new Error('Invalid account format: ' + accountToGrantTo)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role granting...`
    )

    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending grantRole transaction...')
    let tx
    try {
        tx = await accessControl.grantRole(roleToGrant, accountToGrantTo)
        console.log(`   🔗 Transaction submitted: ${tx.hash}`)
    } catch (error) {
        console.log('❌ Transaction failed to submit')
        // Enhance error with context
        const enhancedError: EnhancedError = new Error(
            `Failed to submit grantRole transaction: ${error instanceof Error ? error.message : String(error)}`
        ) as EnhancedError
        enhancedError.originalError = error
        enhancedError.context = {
            operation: 'grantRole',
            role: roleToGrant,
            account: accountToGrantTo,
            contract: diamond,
            curve: signatureProvider.getCurveType(),
        }
        throw enhancedError
    }

    console.log('⏳ Waiting for transaction to be mined...')
    let grantRoleEvent
    try {
        grantRoleEvent = await getEvent('RoleGranted', tx, accessControl)
    } catch (error) {
        console.log(
            `❌ Transaction failed to mine or no RoleGranted event found`
        )
        console.log(`   🔗 Transaction Hash: ${tx.hash}`)

        // Try to get transaction receipt for more details
        try {
            const receipt = await tx.wait()
            console.log(
                `   📄 Transaction Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`
            )
            console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`)
        } catch (receiptError) {
            console.log(
                `   ⚠️  Could not get transaction receipt: ${receiptError.message}`
            )
        }

        // Enhance error with transaction details
        const enhancedError: EnhancedError = new Error(
            `grantRole transaction failed: ${error instanceof Error ? error.message : String(error)}`
        ) as EnhancedError
        enhancedError.originalError = error
        enhancedError.transactionHash = tx.hash
        enhancedError.context = {
            operation: 'grantRole',
            role: roleToGrant,
            account: accountToGrantTo,
            contract: diamond,
            curve: signatureProvider.getCurveType(),
        }
        throw enhancedError
    }

    const { role, account, sender } = grantRoleEvent.args

    return {
        role,
        account,
        sender,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function grantRoleLegacy(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signer: Signer
): Promise<{ role: string; account: string; sender: string }> {
    console.warn(
        '⚠️  Using legacy grantRole - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToGrant, 32))
        throw new Error('Invalid role format: ' + roleToGrant)
    if (!isValidBytesAndLength(accountToGrantTo, 20))
        throw new Error('Invalid account format: ' + accountToGrantTo)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.grantRole(roleToGrant, accountToGrantTo)
    const grantRoleEvent = await getEvent('RoleGranted', tx, accessControl)

    const { role, account, sender } = grantRoleEvent.args

    return {
        role,
        account,
        sender,
    }
}
