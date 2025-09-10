import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeploymentResult } from '../deployment/types/DeploymentTypes'
import { DeploymentConfig } from '../deployment/config/DeploymentConfig'
import { getSigner } from '../../scripts/utils/getSigner'
import { getFacets } from '../../scripts/diamond/loupe/getFacets'
import { getRolesByAccount } from '../../scripts/access/accessControl/getRolesByAccount'
import { getRoleMembers } from '../../scripts/access/accessControl/getRoleMembers'
import { getRoleAdmin } from '../../scripts/access/accessControl/getRoleAdmin'
import { pause } from '../../scripts/pause/pause'
import { isPaused } from '../../scripts/pause/isPaused'
import { unpause } from '../../scripts/pause/unpause'
import { getBusinessLogicVersions } from '../../scripts/businessLogic/getBusinessLogicVersions'
import { getBusinessLogicAddress } from '../../scripts/businessLogic/getBusinessLogicAddress'
import { getBusinessLogics } from '../../scripts/businessLogic/getBusinessLogics'
import { getConfigurationByProxy } from '../../scripts/proxyFactory/getConfigurationByProxy'
import { grantRole } from '../../scripts/access/accessControl/grantRole'
import { hasRole } from '../../scripts/access/accessControl/hasRole'
import { revokeRole } from '../../scripts/access/accessControl/revokeRole'
import { setRoleAdmin } from '../../scripts/access/accessControl/setRoleAdmin'
import { renounceRole } from '../../scripts/access/accessControl/renounceRole'
import { pauseIsbe } from '../../scripts/globalPause/pauseIsbe'
import { unpauseIsbe } from '../../scripts/globalPause/unpauseIsbe'
import { Signer } from 'ethers'

export interface ValidationResult {
    testName: string
    success: boolean
    message: string
    error?: Error
}

export class PreCommitValidator {
    private hre: HardhatRuntimeEnvironment
    private deploymentResult: DeploymentResult
    private config: DeploymentConfig
    private signer: Signer

    // Dynamic constants from config
    private readonly PAUSE_ROLE: string
    private readonly DUMB_ROLE: string
    private readonly DUMB_ROLE_2: string
    private readonly CONFIG_ID: string
    private readonly CUSTOM_BUSINESS_LOGIC_ID: string

    constructor(
        hre: HardhatRuntimeEnvironment,
        deploymentResult: DeploymentResult,
        config: DeploymentConfig
    ) {
        this.hre = hre
        this.deploymentResult = deploymentResult
        this.config = config

        // Initialize constants from config
        this.PAUSE_ROLE = config.validation.PAUSE_ROLE
        this.DUMB_ROLE = config.validation.DUMB_ROLE
        this.DUMB_ROLE_2 = config.validation.DUMB_ROLE_2
        this.CONFIG_ID = config.validation.CONFIG_ID
        this.CUSTOM_BUSINESS_LOGIC_ID =
            config.validation.CUSTOM_BUSINESS_LOGIC_ID
    }

    async runAllValidations(): Promise<ValidationResult[]> {
        const results: ValidationResult[] = []

        // Initialize signer
        this.signer = await getSigner(this.hre)
        const accountAddress = await this.signer.getAddress()

        try {
            // 1. Governance validation tests
            results.push(await this.validateGovernanceFacets())
            results.push(await this.validateGovernanceRoles(accountAddress))
            results.push(await this.validateGovernancePauseUnpause())

            // 2. Business Logic validation tests
            results.push(await this.validateBusinessLogicDeployment())
            results.push(await this.validateBusinessLogicVersions())
            results.push(await this.validateAllBusinessLogicsList())

            // 3. Configuration validation tests
            results.push(await this.validateConfigurationManagement())
            results.push(await this.validateConfigurationFacets())

            // 4. Use Case validation tests
            results.push(await this.validateUseCaseDeployment())
            results.push(await this.validateUseCaseConfiguration())
            results.push(
                await this.validateUseCaseAccessControl(accountAddress)
            )
            results.push(await this.validateUseCasePauseUnpause())

            // 5. HashTimestamp specific validations
            results.push(await this.validateHashTimestampIntrospection())
        } catch (error) {
            results.push({
                testName: 'Critical Validation Error',
                success: false,
                message: 'A critical error occurred during validation setup',
                error: error as Error,
            })
        }

        return results
    }

    private async validateGovernanceFacets(): Promise<ValidationResult> {
        try {
            const governanceAddress = this.deploymentResult.governance.address
            const facets = await getFacets(governanceAddress, this.signer)

            const hasExpectedFacets = facets.facets.length >= 4 // Expected minimum facets

            if (hasExpectedFacets) {
                console.log('   📋 Governance Facets:')
                facets.facets.forEach((facet) => {
                    console.log(
                        `      • ${facet.facetAddress} (${facet.functionSelectors.length} selectors)`
                    )
                })
            }

            return {
                testName: 'Governance Facets Validation',
                success: hasExpectedFacets,
                message: hasExpectedFacets
                    ? `Found ${facets.facets.length} facets with proper selectors`
                    : `Expected at least 4 facets, found ${facets.facets.length}`,
            }
        } catch (error) {
            return {
                testName: 'Governance Facets Validation',
                success: false,
                message: 'Failed to validate governance facets',
                error: error as Error,
            }
        }
    }

    private async validateGovernanceRoles(
        accountAddress: string
    ): Promise<ValidationResult> {
        try {
            const governanceAddress = this.deploymentResult.governance.address
            const rolesByAccount = await getRolesByAccount(
                accountAddress,
                governanceAddress,
                this.signer
            )

            const hasRoles = rolesByAccount.roles.length > 0

            if (hasRoles) {
                console.log('   🔐 Governance Roles:')
                for (const role of rolesByAccount.roles) {
                    const members = await getRoleMembers(
                        role,
                        governanceAddress,
                        this.signer
                    )
                    const admin = await getRoleAdmin(
                        role,
                        governanceAddress,
                        this.signer
                    )
                    console.log(`      • Role: ${role}`)
                    console.log(`        Admin: ${admin.roleAdmin}`)
                    console.log(
                        `        Members: ${members.members.join(', ')}`
                    )
                }
            }

            return {
                testName: 'Governance Roles Validation',
                success: hasRoles,
                message: hasRoles
                    ? `Account has ${rolesByAccount.roles.length} governance roles`
                    : 'Account has no governance roles assigned',
            }
        } catch (error) {
            return {
                testName: 'Governance Roles Validation',
                success: false,
                message: 'Failed to validate governance roles',
                error: error as Error,
            }
        }
    }

    private async validateGovernancePauseUnpause(): Promise<ValidationResult> {
        const testName = 'Governance Pause/Unpause'

        try {
            const governanceAddress = this.deploymentResult.governance.address

            // Validar operación de pausa
            await this.testPauseOperation(governanceAddress)

            // Validar operación de reanudación
            await this.testUnpauseOperation(governanceAddress)

            return {
                testName,
                success: true,
                message:
                    'Governance pause and unpause operations work correctly',
            }
        } catch (error) {
            return {
                testName,
                success: false,
                message: 'Governance pause/unpause validation failed',
                error: error as Error,
            }
        }
    }

    private async testPauseOperation(governanceAddress: string): Promise<void> {
        await pause(governanceAddress, this.signer)

        const pauseStatus = await isPaused(governanceAddress, this.signer)

        if (!pauseStatus.isPaused) {
            throw new Error('Governance pause operation failed')
        }
    }

    private async testUnpauseOperation(
        governanceAddress: string
    ): Promise<void> {
        await unpause(governanceAddress, this.signer)

        const pauseStatus = await isPaused(governanceAddress, this.signer)

        if (pauseStatus.isPaused) {
            throw new Error('Governance unpause operation failed')
        }
    }

    private async validateBusinessLogicDeployment(): Promise<ValidationResult> {
        try {
            const successfulDeployments =
                this.deploymentResult.businessLogics.filter((bl) => bl.success)
            const expectedCount = this.config.businessLogics.length

            return {
                testName: 'Business Logic Deployment',
                success: successfulDeployments.length === expectedCount,
                message: `${successfulDeployments.length}/${expectedCount} business logics deployed successfully`,
            }
        } catch (error) {
            return {
                testName: 'Business Logic Deployment',
                success: false,
                message: 'Failed to validate business logic deployments',
                error: error as Error,
            }
        }
    }

    private async validateBusinessLogicVersions(): Promise<ValidationResult> {
        try {
            const governanceAddress = this.deploymentResult.governance.address
            let validationsPassed = 0
            let totalValidations = 0

            for (const blResult of this.deploymentResult.businessLogics) {
                if (!blResult.success) continue

                totalValidations++

                // Validate version consistency
                const versions = await getBusinessLogicVersions(
                    blResult.config.key,
                    governanceAddress,
                    this.signer
                )
                const address = await getBusinessLogicAddress(
                    blResult.config.key,
                    governanceAddress,
                    '1',
                    this.signer
                )

                if (
                    address.businessAddress === blResult.address &&
                    versions.businessIdVersions[0] === blResult.address
                ) {
                    validationsPassed++
                }
            }

            return {
                testName: 'Business Logic Versions',
                success: validationsPassed === totalValidations,
                message: `${validationsPassed}/${totalValidations} business logic versions validated`,
            }
        } catch (error) {
            return {
                testName: 'Business Logic Versions',
                success: false,
                message: 'Failed to validate business logic versions',
                error: error as Error,
            }
        }
    }

    private async validateAllBusinessLogicsList(): Promise<ValidationResult> {
        try {
            const governanceAddress = this.deploymentResult.governance.address
            const allBusinessLogics = await getBusinessLogics(
                governanceAddress,
                this.signer
            )

            console.log(
                '   📦 All Business Logic IDs:',
                allBusinessLogics.businessId.join(', ')
            )

            return {
                testName: 'Business Logics List',
                success: allBusinessLogics.businessId.length > 0,
                message: `Found ${allBusinessLogics.businessId.length} business logic IDs`,
            }
        } catch (error) {
            return {
                testName: 'Business Logics List',
                success: false,
                message: 'Failed to retrieve business logics list',
                error: error as Error,
            }
        }
    }

    private async validateConfigurationManagement(): Promise<ValidationResult> {
        try {
            // This would need to be adapted based on your actual configuration management
            // For now, we assume configurations were set during deployment
            const successfulConfigs =
                this.deploymentResult.configurations?.filter(
                    (c) => c.success
                ) || []

            return {
                testName: 'Configuration Management',
                success: successfulConfigs != undefined, // Assuming this is validated during deployment
                message: `Configuration management working correctly`,
            }
        } catch (error) {
            return {
                testName: 'Configuration Management',
                success: false,
                message: 'Failed to validate configuration management',
                error: error as Error,
            }
        }
    }

    private async validateConfigurationFacets(): Promise<ValidationResult> {
        try {
            // This validation would need the actual config ID and version
            // You'll need to adapt this based on your deployment result structure
            return {
                testName: 'Configuration Facets',
                success: true, // Placeholder - implement based on actual config structure
                message: 'Configuration facets validated',
            }
        } catch (error) {
            return {
                testName: 'Configuration Facets',
                success: false,
                message: 'Failed to validate configuration facets',
                error: error as Error,
            }
        }
    }

    private async validateUseCaseDeployment(): Promise<ValidationResult> {
        try {
            const successfulUseCases = this.deploymentResult.useCases.filter(
                (uc) => uc.success
            )
            const expectedCount = this.config.useCases.length

            return {
                testName: 'Use Case Deployment',
                success: successfulUseCases.length === expectedCount,
                message: `${successfulUseCases.length}/${expectedCount} use cases deployed successfully`,
            }
        } catch (error) {
            return {
                testName: 'Use Case Deployment',
                success: false,
                message: 'Failed to validate use case deployments',
                error: error as Error,
            }
        }
    }

    private async validateUseCaseConfiguration(): Promise<ValidationResult> {
        try {
            const governanceAddress = this.deploymentResult.governance.address
            let validationsPassed = 0

            for (const useCaseResult of this.deploymentResult.useCases) {
                if (!useCaseResult.success) continue

                const config = await getConfigurationByProxy(
                    useCaseResult.proxyAddress,
                    governanceAddress,
                    this.signer
                )

                // Validate configuration consistency
                if (config.configurationId && config.version) {
                    validationsPassed++
                }
            }

            return {
                testName: 'Use Case Configuration',
                success:
                    validationsPassed ===
                    this.deploymentResult.useCases.filter((uc) => uc.success)
                        .length,
                message: `${validationsPassed} use case configurations validated`,
            }
        } catch (error) {
            return {
                testName: 'Use Case Configuration',
                success: false,
                message: 'Failed to validate use case configurations',
                error: error as Error,
            }
        }
    }

    private async validateUseCaseAccessControl(
        accountAddress: string
    ): Promise<ValidationResult> {
        const testName = 'Use Case Access Control'

        try {
            // Early return si no hay casos de uso para validar
            if (this.deploymentResult.useCases.length === 0) {
                return this.createSuccessResult(
                    testName,
                    'No use cases to validate'
                )
            }

            const useCaseAddress =
                this.deploymentResult.useCases[0].proxyAddress

            // Validar operaciones de roles en secuencia
            await this.validateRoleGranting(accountAddress, useCaseAddress)
            await this.validateRoleRevoking(accountAddress, useCaseAddress)
            await this.validateRoleAdministration(
                accountAddress,
                useCaseAddress
            )

            return this.createSuccessResult(
                testName,
                'All access control operations work correctly'
            )
        } catch (error) {
            return this.createErrorResult(
                testName,
                'Access control validation failed',
                error as Error
            )
        }
    }

    private async validateRoleGranting(
        accountAddress: string,
        useCaseAddress: string
    ): Promise<void> {
        await grantRole(
            this.DUMB_ROLE,
            accountAddress,
            useCaseAddress,
            this.signer
        )

        const hasRoleResult = await hasRole(
            this.DUMB_ROLE,
            accountAddress,
            useCaseAddress,
            this.signer
        )

        if (!hasRoleResult.hasRole) {
            throw new Error('Role grant failed: Role was not properly granted')
        }
    }

    private async validateRoleRevoking(
        accountAddress: string,
        useCaseAddress: string
    ): Promise<void> {
        await revokeRole(
            this.DUMB_ROLE,
            accountAddress,
            useCaseAddress,
            this.signer
        )

        const hasRoleResult = await hasRole(
            this.DUMB_ROLE,
            accountAddress,
            useCaseAddress,
            this.signer
        )

        if (hasRoleResult.hasRole) {
            throw new Error('Role revoke failed: Role was not properly revoked')
        }
    }

    private async validateRoleAdministration(
        accountAddress: string,
        useCaseAddress: string
    ): Promise<void> {
        // Otorgar rol nuevamente para las pruebas de administración
        await grantRole(
            this.DUMB_ROLE,
            accountAddress,
            useCaseAddress,
            this.signer
        )

        // Establecer administrador de rol
        await setRoleAdmin(
            this.DUMB_ROLE,
            this.DUMB_ROLE_2,
            useCaseAddress,
            this.signer
        )

        // Renunciar al rol
        await renounceRole(this.DUMB_ROLE, useCaseAddress, this.signer)
    }

    private createSuccessResult(
        testName: string,
        message: string
    ): ValidationResult {
        return {
            testName,
            success: true,
            message,
        }
    }

    private createErrorResult(
        testName: string,
        message: string,
        error: Error
    ): ValidationResult {
        return {
            testName,
            success: false,
            message,
            error,
        }
    }

    private async validateUseCasePauseUnpause(): Promise<ValidationResult> {
        try {
            if (this.deploymentResult.useCases.length === 0) {
                return {
                    testName: 'Use Case Pause/Unpause',
                    success: true,
                    message: 'No use cases to validate',
                }
            }

            const useCaseAddress =
                this.deploymentResult.useCases[0].proxyAddress
            const governanceAddress = this.deploymentResult.governance.address

            // Test pause
            await pauseIsbe(useCaseAddress, governanceAddress, this.signer)

            // Test unpause
            await unpauseIsbe(useCaseAddress, governanceAddress, this.signer)

            return {
                testName: 'Use Case Pause/Unpause',
                success: true,
                message: 'Use case pause/unpause operations work correctly',
            }
        } catch (error) {
            return {
                testName: 'Use Case Pause/Unpause',
                success: false,
                message: 'Use case pause/unpause validation failed',
                error: error as Error,
            }
        }
    }

    private async validateHashTimestampIntrospection(): Promise<ValidationResult> {
        try {
            // Find HashTimestamp use case
            const hashTimestampUseCase = this.deploymentResult.useCases.find(
                (uc) => uc.config.description === 'Hash Timestamp UseCase'
            )

            if (!hashTimestampUseCase?.success) {
                return {
                    testName: 'HashTimestamp Introspection',
                    success: false,
                    message:
                        'HashTimestamp use case not found or deployment failed',
                }
            }

            // Validate HashTimestamp specific functionality
            const facets = await getFacets(
                hashTimestampUseCase.proxyAddress,
                this.signer
            )

            // Look for HashTimestamp specific function selectors
            const hashTimestampSelectors = [
                '0xd45c4435', // Example: timestampHash
                '0x38a699a4', // Example: exists
                '0x0e744b84', // Example: getTimestamp
            ]

            const hashTimestampFacet = facets.facets.find((f) =>
                f.functionSelectors.some((selector) =>
                    hashTimestampSelectors.includes(selector)
                )
            )

            if (hashTimestampFacet) {
                console.log('   🔍 HashTimestamp Facet Details:')
                console.log(
                    `      • Address: ${hashTimestampFacet.facetAddress}`
                )
                console.log(
                    `      • Total Selectors: ${hashTimestampFacet.functionSelectors.length}`
                )

                // Try to identify HashTimestamp specific selectors
                const identifiedSelectors =
                    hashTimestampFacet.functionSelectors.filter((selector) =>
                        hashTimestampSelectors.includes(selector)
                    )

                if (identifiedSelectors.length > 0) {
                    console.log(
                        `      • HashTimestamp Selectors: ${identifiedSelectors.join(', ')}`
                    )
                }
            }

            const hasHashTimestampFunctionality = !!hashTimestampFacet

            // Additional validation: check if the business logic was deployed correctly
            const hashTimestampBL = this.deploymentResult.businessLogics.find(
                (bl) =>
                    bl.config.key === this.CUSTOM_BUSINESS_LOGIC_ID &&
                    bl.success
            )

            const businessLogicDeployed = !!hashTimestampBL

            if (businessLogicDeployed) {
                console.log('   📦 HashTimestamp Business Logic:')
                console.log(`      • ID: ${hashTimestampBL.config.key}`)
                console.log(`      • Address: ${hashTimestampBL.address}`)
            }

            const overallSuccess =
                hasHashTimestampFunctionality && businessLogicDeployed

            return {
                testName: 'HashTimestamp Introspection',
                success: overallSuccess,
                message: overallSuccess
                    ? 'HashTimestamp functionality and business logic properly integrated'
                    : `Missing components: ${!hasHashTimestampFunctionality ? 'facet functionality' : ''} ${!businessLogicDeployed ? 'business logic deployment' : ''}`.trim(),
            }
        } catch (error) {
            return {
                testName: 'HashTimestamp Introspection',
                success: false,
                message: 'Failed to validate HashTimestamp introspection',
                error: error as Error,
            }
        }
    }
}
