import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { GovernanceConfig } from '../types/DeploymentTypes'
import { ISignatureProvider } from '../providers/ISignatureProvider'
import { getIsbeFactory } from '../../../scripts/utils/getIsbeFactory'
import {
    BUSINESS_LOGIC_DEPLOYER_ROLE,
    CLIENT_FILTERING_ROLE,
    DEFAULT_ADMIN_ROLE,
    DID_REGISTRY_ROLE,
    ENS_MANAGER_ROLE,
    GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
    GOVERNANCE_MANAGER_ROLE,
    ISBE_PAUSER_ROLE,
    ISBE_ROLE,
    PROXY_DEPLOYER_ROLE,
    TIMESTAMPING_REGISTRY_ROLE,
} from '../../../utils/constants'

/**
 * Clean governance deployer that uses signature provider abstraction
 * No longer needs to know about curve-specific deployment details
 */
export class CleanGovernanceDeployer {
    constructor(
        private hre: HardhatRuntimeEnvironment,
        private signatureProvider: ISignatureProvider
    ) {}

    async deploy(
        config: GovernanceConfig,
        provider: ISignatureProvider,
    ) {
        console.log('🏛️ Deploying governance system...')
        console.log(`   🔐 Using ${provider.getCurveType()} signatures`)

        try {
            const accountAddress = await this.resolveAccountAddress(
                config,
                provider
            )
            console.log(`   🔐 ISBE Governance account: ${accountAddress}`)

            const factoryAddress = await this.deployFactory(
                accountAddress,
                config,
                provider,
            )
            console.log(`   📍 Factory address: ${factoryAddress}`)

            await this.validateDeployment(factoryAddress)

            // Get factory instance for return
            const signer = await provider.getSigner()
            const factory = await getIsbeFactory(factoryAddress, signer)

            console.log('   ✅ Governance system successfully deployed')

            return {
                address: factoryAddress,
                factory,
                signer,
                config,
            }
        } catch (error) {
            console.error('   ❌ Error deploying governance:', error.message)
            throw error
        }
    }

    private async resolveAccountAddress(
        config: GovernanceConfig,
        provider: ISignatureProvider
    ): Promise<string> {
        return config.accountAddress || (await provider.getAddress())
    }

    private async deployFactory(
        accountAddress: string,
        config: GovernanceConfig,
        provider: ISignatureProvider,
    ): Promise<string> {
        console.log(
            `   🔧 Deploying ISBE factory with ${provider.getCurveType()}...`
        )

        // Deploy all facets first
        const facetDeployments = [
            'BusinessLogicFactoryFacet',
            'ProxyFactoryFacet',
            'GlobalIsbePauseFacet',
            'AccessControlGovernanceFacet',
            'ISBEPauseFacet',
            'DiamondCutAccessControlFacet',
            'DiamondLoupeFacet',
            'ConfigurationManagementFacet',
            'DidDocumentDetailedFacet',
            'DidControllerFacet',
            'DidVerificationMethodFacet',
            'DidVerificationRelationshipFacet',
            'EnsRegistryFacet',
            'TimeStampingRegistryFacet',
            'ClientFilteringFacet',
        ]

        const facetAddresses: string[] = []

        for (const facetName of facetDeployments) {
            console.log(`   📦 Deploying ${facetName}...`)

            // Get contract artifact
            const artifact = await this.hre.artifacts.readArtifact(facetName)

            // Deploy using signature provider (handles curve-specific logic)
            const facetAddress = await provider.deployContract(
                facetName,
                artifact.bytecode
            )

            facetAddresses.push(facetAddress)
        }

        console.log('   💎 Deploying diamond proxy...')

        // Now deploy the diamond proxy with facets
        const proxyArtifact = await this.hre.artifacts.readArtifact(
            'EIP2535AccessControl'
        )

        // Prepare constructor arguments
        const constructorTypes = [
            'address[]',
            'tuple(tuple(bytes32 role, address[] members)[] rbacs, address init, bytes initCalldata)',
        ]

        const diamondArgs = {
            rbacs: [
                {
                    role: DEFAULT_ADMIN_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ISBE_ROLE,
                    members: [accountAddress],
                },
                {
                    role: PROXY_DEPLOYER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: GOVERNANCE_CONFIGURATION_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: BUSINESS_LOGIC_DEPLOYER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ISBE_PAUSER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: GOVERNANCE_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: DID_REGISTRY_ROLE,
                    members: [accountAddress],
                },
                {
                    role: ENS_MANAGER_ROLE,
                    members: [accountAddress],
                },
                {
                    role: CLIENT_FILTERING_ROLE,
                    members: [accountAddress],
                },
                {
                    role: TIMESTAMPING_REGISTRY_ROLE,
                    members: [accountAddress],
                },
            ],
            init: this.hre.ethers.ZeroAddress,
            initCalldata: config.initData,
        }

        const constructorArgs = [facetAddresses, diamondArgs]

        // Deploy diamond proxy using signature provider
        const factoryAddress = await provider.deployContract(
            'EIP2535AccessControl',
            proxyArtifact.bytecode,
            constructorArgs,
            constructorTypes
        )

        return factoryAddress
    }

    private async validateDeployment(factoryAddress: string): Promise<void> {
        const factoryCode =
            await this.hre.ethers.provider.getCode(factoryAddress)
        if (factoryCode === '0x') {
            throw new Error('Factory was not deployed correctly')
        }
        console.log('   ✅ Factory validation passed')
    }
}
