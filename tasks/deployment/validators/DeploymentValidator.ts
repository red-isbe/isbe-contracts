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
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    DeploymentResult,
    ValidationResult,
    DeployedGovernance,
    DeployedBusinessLogic,
    DeployedUseCase,
} from '../types/DeploymentTypes'

/**
 * Deployment validator to verify that everything works correctly
 */
export class DeploymentValidator {
    constructor(private hre: HardhatRuntimeEnvironment) {}

    async validateDeployment(
        deploymentResult: DeploymentResult
    ): Promise<ValidationResult[]> {
        console.log('🔍 Executing deployment validations...')

        const validationResults: ValidationResult[] = []

        try {
            // Validate governance
            if (deploymentResult.governance) {
                const governanceValidation = await this.validateGovernance(
                    deploymentResult.governance
                )
                validationResults.push({
                    type: 'governance',
                    ...governanceValidation,
                })
            }

            // Validate business logics
            const businessLogicsValidation = await this.validateBusinessLogics(
                deploymentResult.businessLogics
            )
            validationResults.push({
                type: 'businessLogics',
                ...businessLogicsValidation,
            })

            // Validate use cases
            const useCasesValidation = await this.validateUseCases(
                deploymentResult.useCases
            )
            validationResults.push({
                type: 'useCases',
                ...useCasesValidation,
            })

            console.log('   ✅ All validations completed')
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            console.error('   ❌ Error during validations:', errorMessage)
            validationResults.push({
                type: 'error',
                success: false,
                error: errorMessage,
            })
        }

        return validationResults
    }

    private async validateGovernance(
        governance: DeployedGovernance
    ): Promise<Partial<ValidationResult>> {
        console.log('      🏛️ Validating governance... ' + governance.address)

        try {
            // Verify that the factory exists and has code
            const code = await this.hre.ethers.provider.getCode(
                governance.address
            )
            if (code === '0x') {
                throw new Error('Factory has no code')
            }

            // Verify that we can call basic functions
            const businessLogics = await governance.factory.getBusinessLogics()
            console.log(
                `         📋 Registered logics: ${businessLogics.length}`
            )

            return {
                success: true,
                address: governance.address,
                businessLogicsCount: businessLogics.length,
                error: undefined,
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'
            console.error(
                '         ❌ Error validating governance:',
                errorMessage
            )
            return {
                success: false,
                address: governance.address,
                error: errorMessage,
            }
        }
    }

    private async validateBusinessLogics(
        businessLogics: DeployedBusinessLogic[]
    ): Promise<Partial<ValidationResult>> {
        console.log('      🔧 Validating business logics...')

        const successful = businessLogics.filter((bl) => bl.success)
        const failed = businessLogics.filter((bl) => !bl.success)

        // Validate that successful ones have code
        let validatedCount = 0
        for (const bl of successful) {
            try {
                if (bl.address) {
                    const code = await this.hre.ethers.provider.getCode(
                        bl.address
                    )
                    if (code !== '0x') {
                        validatedCount++
                    }
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error'
                console.warn(
                    `         ⚠️ Could not validate ${bl.config.description}:`,
                    errorMessage
                )
            }
        }

        console.log(
            `         ✅ Validated: ${validatedCount}/${successful.length} successful logics`
        )

        return {
            success: failed.length === 0,
            total: businessLogics.length,
            successful: successful.length,
            failed: failed.length,
            validated: validatedCount,
            errors: failed.map((bl) => ({
                key: bl.config.key,
                error: bl.error || 'Unknown error',
            })),
        }
    }

    private async validateUseCases(
        useCases: DeployedUseCase[]
    ): Promise<Partial<ValidationResult>> {
        console.log('      🎯 Validating use cases...')

        const successful = useCases.filter((uc) => uc.success)
        const failed = useCases.filter((uc) => !uc.success)

        // Validate that successful proxies have code
        let validatedCount = 0
        for (const uc of successful) {
            try {
                if (uc.proxyAddress) {
                    const code = await this.hre.ethers.provider.getCode(
                        uc.proxyAddress
                    )
                    if (code !== '0x') {
                        validatedCount++
                    }
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error'
                console.warn(
                    `         ⚠️ Could not validate ${uc.config.description}:`,
                    errorMessage
                )
            }
        }

        console.log(
            `         ✅ Validated: ${validatedCount}/${successful.length} successful use cases`
        )

        return {
            success: failed.length === 0,
            total: useCases.length,
            successful: successful.length,
            failed: failed.length,
            validated: validatedCount,
            errors: failed.map((uc) => ({
                configId: uc.config.configurationId,
                error: uc.error || 'Unknown error',
            })),
        }
    }
}
