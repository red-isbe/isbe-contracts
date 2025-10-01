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

    // For secp256r1, use raw transactions to avoid "Cannot find square root" error
    if (signatureProvider.getCurveType() === 'secp256r1') {
        return await grantRoleWithRawTransaction(
            roleToGrant,
            accountToGrantTo,
            diamond,
            signatureProvider
        )
    }

    // For secp256k1, use the standard contract interface
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
        let receipt
        try {
            receipt = await tx.wait()
            console.log(
                `   📄 Transaction Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`
            )
            console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`)
        } catch (receiptError) {
            console.log(
                `   ⚠️  Could not get transaction receipt: ${receiptError.message}`
            )
        }

        // If transaction was successful but event parsing failed, try fallback approaches
        if (receipt && receipt.status === 1) {
            console.log(
                '   🔍 Transaction successful but event parsing failed, trying fallbacks...'
            )

            // Fallback 1: Check if role was actually granted by querying contract state
            try {
                const { hasRole } = await import('./hasRole')
                const signer = await signatureProvider.getSigner()

                const roleCheck = await hasRole(
                    roleToGrant,
                    accountToGrantTo,
                    diamond,
                    signer
                )
                if (roleCheck.hasRole) {
                    console.log(
                        '   ✅ Role was successfully granted (verified by direct state check)'
                    )
                    console.log(`      • Role: ${roleToGrant}`)
                    console.log(`      • Account: ${accountToGrantTo}`)
                    console.log(`      • Contract: ${diamond}`)

                    // Return successful result even without event
                    return {
                        role: roleToGrant,
                        account: accountToGrantTo,
                        sender: await signatureProvider.getAddress(),
                    }
                } else {
                    console.log(
                        '   ❌ Role was not granted (confirmed by direct state check)'
                    )
                }
            } catch (stateCheckError) {
                console.log(
                    `   ⚠️  Could not verify role state: ${stateCheckError instanceof Error ? stateCheckError.message : String(stateCheckError)}`
                )
            }

            // Fallback 2: Try manual event parsing with topic hash
            try {
                const roleGrantedTopic =
                    '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d' // keccak256("RoleGranted(bytes32,address,address)")

                console.log(
                    `   🔍 Analyzing ${receipt.logs.length} logs in receipt:`
                )
                receipt.logs.forEach((log, index) => {
                    console.log(
                        `      Log ${index}: topic0=${log.topics[0]}, address=${log.address}`
                    )
                })

                const matchingLogs = receipt.logs.filter(
                    (log) => log.topics[0] === roleGrantedTopic
                )

                if (matchingLogs.length > 0) {
                    console.log(
                        `   🔍 Found ${matchingLogs.length} RoleGranted event(s) by topic hash`
                    )
                    const log = matchingLogs[0] // Take the first matching log

                    // Manual parsing since interface parsing failed
                    const role = log.topics[1]
                    const account = '0x' + log.topics[2].slice(26) // Remove padding from address
                    const sender = '0x' + log.topics[3].slice(26) // Remove padding from address

                    console.log(`   ✅ Manually parsed RoleGranted event:`)
                    console.log(`      • Role: ${role}`)
                    console.log(`      • Account: ${account}`)
                    console.log(`      • Sender: ${sender}`)

                    return { role, account, sender }
                }
            } catch (manualParseError) {
                console.log(
                    `   ❌ Manual event parsing failed: ${manualParseError instanceof Error ? manualParseError.message : String(manualParseError)}`
                )
            }
        }

        // If all fallbacks failed, enhance error with transaction details
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
 * Grant role using raw transactions for secp256r1 compatibility
 * Avoids the "Cannot find square root" error by bypassing ethers Contract interface
 */
async function grantRoleWithRawTransaction(
    roleToGrant: string,
    accountToGrantTo: string,
    diamond: string,
    signatureProvider: ISignatureProvider
): Promise<{ role: string; account: string; sender: string }> {
    // Import AccessControl interface for encoding function data
    const { AccessControlGovernanceFacet__factory } = await import(
        '../../../typechain-types'
    )

    // Create interface for encoding function data
    const accessControlInterface =
        AccessControlGovernanceFacet__factory.createInterface()

    // Encode the grantRole function call
    const functionData = accessControlInterface.encodeFunctionData(
        'grantRole',
        [roleToGrant, accountToGrantTo]
    )

    console.log('📡 Sending grantRole raw transaction...')
    console.log(`   📍 Target contract: ${diamond}`)
    console.log(`   📄 Function data: ${functionData}`)
    console.log(`   📝 Role to grant: ${roleToGrant}`)
    console.log(`   👥 Account to grant to: ${accountToGrantTo}`)

    let txResponse
    try {
        // Send raw transaction using signature provider
        txResponse = await signatureProvider.sendTransaction({
            to: diamond,
            data: functionData,
            gasLimit: 200000n, // Reasonable gas limit for grantRole
        })

        console.log(`   🔗 Transaction submitted: ${txResponse.hash}`)
    } catch (error) {
        console.log(error)
        console.log('❌ Raw transaction failed to submit')
        throw new Error(
            `Failed to submit grantRole raw transaction: ${error instanceof Error ? error.message : String(error)}`
        )
    }

    console.log('⏳ Waiting for raw transaction to be mined...')
    let receipt
    try {
        receipt = await txResponse.wait()
        if (!receipt || receipt.status !== 1) {
            throw new Error('Transaction failed or was reverted')
        }

        // Debug transaction receipt details
        console.log(`   📄 Transaction Receipt Details:`)
        console.log(`      • Status: ${receipt.status}`)
        console.log(`      • Block: ${receipt.blockNumber}`)
        console.log(`      • Gas Used: ${receipt.gasUsed.toString()}`)
        console.log(`      • To: ${receipt.to}`)
        console.log(`      • From: ${receipt.from}`)
        console.log(`      • Logs Count: ${receipt.logs.length}`)
    } catch (error) {
        console.log(`❌ Raw transaction failed to mine`)
        console.log(`   🔗 Transaction Hash: ${txResponse.hash}`)
        throw error
    }

    // Parse RoleGranted event from the receipt using the same approach as secp256k1
    // First, try to use the AccessControl interface to parse the logs
    let roleGrantedEvent = null
    const parseErrors: string[] = []

    // For secp256r1 raw transactions, we need to refetch the receipt to ensure logs are populated
    let finalReceipt = receipt
    if (receipt.logs.length === 0) {
        console.log(
            '   🔄 Receipt shows 0 logs, refetching for secp256r1 compatibility...'
        )
        try {
            // Get fresh receipt from provider - try multiple access paths
            let provider = null

            // Try to get provider from signer first
            try {
                const signer = await signatureProvider.getSigner()
                provider = signer.provider
            } catch {
                // Fallback to accessing HRE provider directly if signature provider exposes it
                if (
                    'hre' in signatureProvider &&
                    signatureProvider.hre?.ethers?.provider
                ) {
                    provider = signatureProvider.hre.ethers.provider
                }
            }

            if (provider) {
                // Try multiple approaches to get logs
                const freshReceipt = await provider.getTransactionReceipt(
                    txResponse.hash
                )
                if (freshReceipt && freshReceipt.logs.length > 0) {
                    finalReceipt = freshReceipt
                    console.log(
                        `   ✅ Refetched receipt now has ${freshReceipt.logs.length} logs`
                    )
                } else {
                    // Try getting logs from the block directly
                    console.log(
                        `   🔍 Trying to fetch logs from block ${freshReceipt?.blockNumber}...`
                    )
                    if (freshReceipt?.blockNumber) {
                        try {
                            const roleGrantedTopic =
                                '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d'
                            const logs = await provider.getLogs({
                                fromBlock: freshReceipt.blockNumber,
                                toBlock: freshReceipt.blockNumber,
                                topics: [roleGrantedTopic],
                                address: diamond, // Filter by contract address to ensure we get the right events
                            })
                            console.log(
                                `   🔍 Found ${logs.length} RoleGranted events in block ${freshReceipt.blockNumber}`
                            )

                            // Find logs that match our transaction
                            const txLogs = logs.filter(
                                (log) => log.transactionHash === txResponse.hash
                            )
                            if (txLogs.length > 0) {
                                console.log(
                                    `   ✅ Found ${txLogs.length} RoleGranted logs for our transaction`
                                )
                                // Create a new receipt with the found logs
                                finalReceipt = { ...freshReceipt, logs: txLogs }
                            }
                        } catch (blockLogError) {
                            console.log(
                                `   ⚠️  Could not fetch block logs: ${blockLogError instanceof Error ? blockLogError.message : String(blockLogError)}`
                            )
                        }
                    }
                }
            }
        } catch (refetchError) {
            console.log(
                `   ⚠️  Could not refetch receipt: ${refetchError instanceof Error ? refetchError.message : String(refetchError)}`
            )
        }
    }

    for (let i = 0; i < finalReceipt.logs.length; i++) {
        const log = finalReceipt.logs[i]
        try {
            const parsed = accessControlInterface.parseLog(log)
            if (parsed && parsed.name === 'RoleGranted') {
                roleGrantedEvent = parsed
                break
            }
        } catch (error) {
            // Collect parse errors but don't fail immediately
            parseErrors.push(
                `Log ${i}: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    if (!roleGrantedEvent) {
        console.log(`   📄 Transaction Status: Success`)
        console.log(`   ⛽ Gas Used: ${finalReceipt.gasUsed.toString()}`)
        console.log(`   📊 Total Logs: ${finalReceipt.logs.length}`)
        if (parseErrors.length > 0) {
            console.log(`   ⚠️  Parse errors: ${parseErrors.join('; ')}`)
        }

        // Try to find RoleGranted event by topic hash as a fallback
        const roleGrantedTopic =
            '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d' // keccak256("RoleGranted(bytes32,address,address)")

        // Debug: Print all log topics to see what events are actually emitted
        console.log(
            `   🔍 Analyzing ${finalReceipt.logs.length} logs in receipt:`
        )
        finalReceipt.logs.forEach((log, index) => {
            console.log(
                `      Log ${index}: topic0=${log.topics[0]}, address=${log.address}`
            )
        })

        const matchingLogs = finalReceipt.logs.filter(
            (log) => log.topics[0] === roleGrantedTopic
        )

        if (matchingLogs.length > 0) {
            console.log(
                `   🔍 Found ${matchingLogs.length} RoleGranted event(s) by topic hash`
            )
            const log = matchingLogs[0] // Take the first matching log
            try {
                // Manual parsing since interface parsing failed
                const role = log.topics[1]
                const account = '0x' + log.topics[2].slice(26) // Remove padding from address
                const sender = '0x' + log.topics[3].slice(26) // Remove padding from address

                console.log(`   ✅ Manually parsed RoleGranted event:`)
                console.log(`      • Role: ${role}`)
                console.log(`      • Account: ${account}`)
                console.log(`      • Sender: ${sender}`)

                return { role, account, sender }
            } catch (manualParseError) {
                console.log(
                    `   ❌ Manual parsing also failed: ${manualParseError.message}`
                )
            }
        }

        // If no event was found but transaction was successful, validate the role was actually granted
        // by checking the contract state directly
        console.log(
            '   🔍 No RoleGranted event found, checking role state directly...'
        )
        try {
            // Import hasRole function to check if role was actually granted
            const { hasRole } = await import('./hasRole')
            const signer = await signatureProvider.getSigner()

            const roleCheck = await hasRole(
                roleToGrant,
                accountToGrantTo,
                diamond,
                signer
            )
            if (roleCheck.hasRole) {
                console.log(
                    '   ✅ Role was successfully granted (verified by direct state check)'
                )
                console.log(`      • Role: ${roleToGrant}`)
                console.log(`      • Account: ${accountToGrantTo}`)
                console.log(`      • Contract: ${diamond}`)

                // Return successful result even without event
                return {
                    role: roleToGrant,
                    account: accountToGrantTo,
                    sender:
                        txResponse.from ||
                        (await signatureProvider.getAddress()),
                }
            } else {
                console.log(
                    '   ❌ Role was not granted (confirmed by direct state check)'
                )
            }
        } catch (stateCheckError) {
            console.log(
                `   ⚠️  Could not verify role state: ${stateCheckError instanceof Error ? stateCheckError.message : String(stateCheckError)}`
            )
        }

        // Enhanced error message with more debugging info
        const errorMessage =
            parseErrors.length > 0
                ? `RoleGranted event not found in transaction receipt. Parse errors encountered: ${parseErrors.join('; ')}`
                : `RoleGranted event not found in transaction receipt. No matching events found in ${finalReceipt.logs.length} logs.`

        throw new Error(errorMessage)
    }

    const { role, account, sender } = roleGrantedEvent.args

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
