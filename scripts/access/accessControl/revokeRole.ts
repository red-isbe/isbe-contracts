import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Revoke role using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function revokeRole(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    account: string
    sender: string
}> {
    if (!isValidBytesAndLength(roleToRevoke, 32))
        throw new Error('Invalid role format: ' + roleToRevoke)
    if (!isValidBytesAndLength(accountToRevokeFrom, 20))
        throw new Error('Invalid account format: ' + accountToRevokeFrom)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for role revoking...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await revokeRoleWithRawTransaction(
            roleToRevoke,
            accountToRevokeFrom,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending revokeRole transaction...')
    const tx = await accessControl.revokeRole(roleToRevoke, accountToRevokeFrom)

    console.log('⏳ Waiting for transaction to be mined...')
    const revokeEvent = await getEvent('RoleRevoked', tx, accessControl)

    const { role, account, sender } = revokeEvent.args

    return {
        role,
        account,
        sender,
    }
}

/**
 * Revoke role using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function revokeRoleWithRawTransaction(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    account: string
    sender: string
}> {
    // Import AccessControl interface for encoding function data
    const { AccessControlGovernanceFacet__factory } =
        await import('../../../typechain-types')

    // Create interface for encoding function data
    const accessControlInterface =
        AccessControlGovernanceFacet__factory.createInterface()

    // Encode the revokeRole function call
    const functionData = accessControlInterface.encodeFunctionData(
        'revokeRole',
        [roleToRevoke, accountToRevokeFrom]
    )

    console.log('📡 Sending revokeRole raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 200000n, // Reasonable gas limit for revokeRole
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit revokeRole raw transaction: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt
    try {
        receipt = await txResponse.wait()
        if (!receipt || receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }
    } catch (error) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse RoleRevoked event from the receipt
    const roleRevokedEvent = receipt.logs
        .map((log) => {
            try {
                return accessControlInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === 'RoleRevoked')

    if (!roleRevokedEvent) {
        throw new Error('RoleRevoked event not found in transaction receipt')
    }

    const { role, account, sender } = roleRevokedEvent.args

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
export async function revokeRoleLegacy(
    roleToRevoke: string,
    accountToRevokeFrom: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    account: string
    sender: string
}> {
    console.warn(
        '⚠️  Using legacy revokeRole - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToRevoke, 32))
        throw new Error('Invalid role format: ' + roleToRevoke)
    if (!isValidBytesAndLength(accountToRevokeFrom, 20))
        throw new Error('Invalid account format: ' + accountToRevokeFrom)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.revokeRole(roleToRevoke, accountToRevokeFrom)
    const revokeEvent = await getEvent('RoleRevoked', tx, accessControl)

    const { role, account, sender } = revokeEvent.args

    return {
        role,
        account,
        sender,
    }
}
