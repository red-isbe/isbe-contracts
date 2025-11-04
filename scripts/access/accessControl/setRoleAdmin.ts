import { Signer } from 'ethers'
import { ISignatureProvider } from '../../../tasks/deployment/providers/ISignatureProvider'
import { isValidBytesAndLength } from '../../utils/validation'
import { getAccessControl } from '../../utils/getAccessControl'
import { getEvent } from '../../utils/getEvent'

/**
 * Set role admin using signature provider pattern (supports both secp256k1 and secp256r1)
 */
export async function setRoleAdmin(
    roleToUpdate: string,
    adminRole: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    previousAdminRole: string
    newAdminRole: string
    sender: string
}> {
    if (!isValidBytesAndLength(roleToUpdate, 32))
        throw new Error('Invalid role format: ' + roleToUpdate)
    if (!isValidBytesAndLength(adminRole, 32))
        throw new Error('Invalid admin role format: ' + adminRole)

    console.log(
        `🔐 Using ${signatureProvider.getCurveType()} signature for setting role admin...`
    )

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await setRoleAdminWithRawTransaction(
            roleToUpdate,
            adminRole,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
    const signer = await signatureProvider.getSigner()
    const accessControl = await getAccessControl(diamond, signer)

    console.log('📡 Sending setRoleAdmin transaction...')
    const tx = await accessControl.setRoleAdmin(roleToUpdate, adminRole)

    console.log('⏳ Waiting for transaction to be mined...')
    const setRoleAdminEvent = await getEvent(
        'RoleAdminChanged',
        tx,
        accessControl
    )

    const { role, previousAdminRole, newAdminRole, sender } =
        setRoleAdminEvent.args

    return {
        role,
        previousAdminRole,
        newAdminRole,
        sender,
    }
}

/**
 * Set role admin using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function setRoleAdminWithRawTransaction(
    roleToUpdate: string,
    adminRole: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{
    role: string
    previousAdminRole: string
    newAdminRole: string
    sender: string
}> {
    // Import AccessControl interface for encoding function data
    const { AccessControlGovernanceFacet__factory } = await import(
        '../../../typechain-types'
    )

    // Create interface for encoding function data
    const accessControlInterface =
        AccessControlGovernanceFacet__factory.createInterface()

    // Encode the setRoleAdmin function call
    const functionData = accessControlInterface.encodeFunctionData(
        'setRoleAdmin',
        [roleToUpdate, adminRole]
    )

    console.log('📡 Sending setRoleAdmin raw transaction...')

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 200000n, // Reasonable gas limit for setRoleAdmin
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit setRoleAdmin raw transaction: ${error instanceof Error ? error.message : String(error)}`
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

    // Parse RoleAdminChanged event from the receipt
    const roleAdminChangedEvent = receipt.logs
        .map((log) => {
            try {
                return accessControlInterface.parseLog(log)
            } catch {
                return null
            }
        })
        .find((log) => log && log.name === 'RoleAdminChanged')

    if (!roleAdminChangedEvent) {
        throw new Error(
            'RoleAdminChanged event not found in transaction receipt'
        )
    }

    const { role, previousAdminRole, newAdminRole, sender } =
        roleAdminChangedEvent.args

    return {
        role,
        previousAdminRole,
        newAdminRole,
        sender,
    }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the signature provider version above
 */
export async function setRoleAdminLegacy(
    roleToUpdate: string,
    adminRole: string,
    diamond: string,
    signer: Signer
): Promise<{
    role: string
    previousAdminRole: string
    newAdminRole: string
    sender: string
}> {
    console.warn(
        '⚠️  Using legacy setRoleAdmin - consider switching to signature provider version'
    )

    if (!isValidBytesAndLength(roleToUpdate, 32))
        throw new Error('Invalid role format: ' + roleToUpdate)
    if (!isValidBytesAndLength(adminRole, 32))
        throw new Error('Invalid admin role format: ' + adminRole)

    const accessControl = await getAccessControl(diamond, signer)
    const tx = await accessControl.setRoleAdmin(roleToUpdate, adminRole)
    const setRoleAdminEvent = await getEvent(
        'RoleAdminChanged',
        tx,
        accessControl
    )

    const { role, previousAdminRole, newAdminRole, sender } =
        setRoleAdminEvent.args

    return {
        role,
        previousAdminRole,
        newAdminRole,
        sender,
    }
}
