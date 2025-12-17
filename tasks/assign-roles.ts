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
-------------------------------------------------------------- */
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

interface RoleConfig {
    [roleName: string]: number // Maps role names to signer indices
}

const ROLE_CONFIG: RoleConfig = {
    PAUSER_ROLE: 1, // Account 2 (index 1)
    GOVERNANCE_MANAGER_ROLE: 2, // Account 3 (index 2)
    BUSINESS_LOGIC_DEPLOYER_ROLE: 3, // Account 4 (index 3)
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE: 4, // Account 5 (index 4)
    PROXY_DEPLOYER_ROLE: 5, // Account 6 (index 5)
    ISBE_PAUSER_ROLE: 6, // Account 7 (index 6)
    DID_REGISTRY_ROLE: 7, // Account 8 (index 7)
    TRUSTED_ISSUERS_REGISTRY_ROLE: 8, // Account 9 (index 8)
    ENS_MANAGER_ROLE: 9, // Account 10 (index 9)
    CLIENT_FILTERING_ROLE: 10, // Account 11 (index 10)
    BESU_NODE_MANAGER_ROLE: 11, // Account 12 (index 11)
    ANCHORER_ROLE: 12, // Account 13 (index 12)
    METADATA_MANAGER_ROLE: 13, // Account 14 (index 13)
    NETWORK_DIRECTORY_ROLE: 14, // Account 15 (index 14)
    TIMESTAMPING_REGISTRY_ROLE: 15, // Account 16 (index 15)
}

task(
    'assign-roles',
    'Assign governance roles to accounts using Hardhat signers'
)
    .addParam('contract', 'The address of the contract to assign roles to')
    .setAction(
        async (
            taskArgs: { contract: string },
            hre: HardhatRuntimeEnvironment
        ) => {
            try {
                // Get contract instance with proper typing
                const contractFactory =
                    await hre.ethers.getContractFactory('YourContractName')
                const contract = contractFactory.attach(taskArgs.contract)

                // Get available signers with typing
                const signers = await hre.ethers.getSigners()
                console.log(`Found ${signers.length} available signers`)

                // Verify we have enough signers
                const requiredSigners =
                    Math.max(...Object.values(ROLE_CONFIG)) + 1
                if (signers.length < requiredSigners) {
                    throw new Error(
                        `Insufficient signers. Need at least ${requiredSigners}, found ${signers.length}`
                    )
                }

                // Assign roles with type safety
                console.log('\nStarting role assignment...')
                for (const [roleName, signerIndex] of Object.entries(
                    ROLE_CONFIG
                )) {
                    // Get role bytes32 value from contract
                    const role: string = await contract[roleName]()
                    const account: string = signers[signerIndex].address

                    console.log(`Assigning ${roleName} to ${account}...`)

                    // Check if role is already assigned
                    const hasRole: boolean = await contract.hasRole(
                        role,
                        account
                    )
                    if (hasRole) {
                        console.log(
                            `✓ ${roleName} already assigned to ${account}`
                        )
                        continue
                    }

                    // Assign role with transaction response typing
                    const tx = await contract.grantRole(role, account)
                    const receipt = await tx.wait()

                    console.log(
                        `✓ Assigned ${roleName} to ${account} (tx: ${receipt.transactionHash})`
                    )
                }

                console.log('\nRole assignment completed successfully!')
            } catch (error) {
                if (error instanceof Error) {
                    console.error('\nRole assignment failed:', error.message)
                } else {
                    console.error('\nRole assignment failed with unknown error')
                }
                process.exit(1)
            }
        }
    )

// Helper task to list available signers with TypeScript
task('list-signers', 'List all available Hardhat signers').setAction(
    async (_, hre: HardhatRuntimeEnvironment) => {
        const signers = await hre.ethers.getSigners()
        console.log(`Available signers (${signers.length}):`)
        signers.forEach((signer, index) => {
            console.log(`${index}: ${signer.address}`)
        })
    }
)
