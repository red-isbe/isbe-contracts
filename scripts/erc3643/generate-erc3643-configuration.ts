import { writeFileSync } from 'fs'
import { join } from 'path'
import { buildConfigurationId } from '../utils/buildConfigurationId'
import {
    ERC20_RESOLVER_KEY,
    ERC20_SNAPSHOT_RESOLVER_KEY,
    ERC203643_CAPPED_RESOLVER_KEY,
    ERC203643_CONTROLLER_RESOLVER_KEY,
    ERC3643_METADATA_RESOLVER_KEY,
    ERC3643_FREEZE_RESOLVER_KEY,
    ERC3643_RECOVERY_RESOLVER_KEY,
    ERC3643_COMPLIANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
    ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
    CONFIGURATION_ID_ERC3643,
} from '../../utils/constants'

interface ERC3643Feature {
    name: string
    description: string
}

interface ERC3643Configuration {
    name: string
    description: string
    configurationId: string
    seed: string
    facets: string[]
    resolverKeys: {
        base: string[]
        erc20Extensions: string[]
        erc3643Core: string[]
        compliance: string[]
    }
    features: {
        base: ERC3643Feature[]
        erc20Extensions: ERC3643Feature[]
        erc3643Core: ERC3643Feature[]
        compliance: ERC3643Feature[]
    }
    roles: {
        role: string
        description: string
    }[]
}

function generateSecurityTokenConfig(): ERC3643Configuration {
    // Define resolver keys by category
    const baseKeys = [ERC20_RESOLVER_KEY]

    const erc20ExtensionKeys = [
        ERC20_SNAPSHOT_RESOLVER_KEY,
        ERC203643_CAPPED_RESOLVER_KEY,
        ERC203643_CONTROLLER_RESOLVER_KEY,
    ]

    const erc3643CoreKeys = [
        ERC3643_METADATA_RESOLVER_KEY,
        ERC3643_FREEZE_RESOLVER_KEY,
        ERC3643_RECOVERY_RESOLVER_KEY,
    ]

    const complianceKeys = [
        ERC3643_COMPLIANCE_RESOLVER_KEY,
        ERC3643_COMPLIANCE_MAXBALANCE_RESOLVER_KEY,
        ERC3643_COMPLIANCE_DMLIM_RESOLVER_KEY,
    ]

    // Combine all resolver keys
    const allResolverKeys = [
        ...baseKeys,
        ...erc20ExtensionKeys,
        ...erc3643CoreKeys,
        ...complianceKeys,
    ]

    // Generate Configuration ID using ADR-003 Position-Based XOR algorithm
    // Keys will be sorted internally by buildConfigurationId
    const configurationId = buildConfigurationId(
        CONFIGURATION_ID_ERC3643,
        allResolverKeys,
        { logLevel: 'verbose' }
    )

    return {
        name: 'SECURITY_TOKEN',
        description:
            'ERC3643 compliant security token with full regulatory compliance features',
        configurationId,
        seed: CONFIGURATION_ID_ERC3643,
        facets: [
            'ERC20Facet',
            'ERC20SnapshotFacet',
            'ERC20CappedFacet',
            'ERC20ControllerFacet',
            'ERC3643MetadataFacet',
            'ERC3643FreezeFacet',
            'ERC3643RecoveryFacet',
            'ERC3643ComplianceFacet',
            'ERC3643ComplianceMaxBalFacet',
            'ERC3643ComplianceDMLimFacet',
        ],
        resolverKeys: {
            base: baseKeys,
            erc20Extensions: erc20ExtensionKeys,
            erc3643Core: erc3643CoreKeys,
            compliance: complianceKeys,
        },
        features: {
            base: [
                {
                    name: 'ERC20',
                    description: 'Standard fungible token functionality',
                },
                {
                    name: 'AccessControl',
                    description: 'Role-based access control',
                },
                {
                    name: 'Pausable',
                    description: 'Emergency pause mechanism',
                },
            ],
            erc20Extensions: [
                {
                    name: 'Snapshot',
                    description:
                        'Balance snapshots for dividends and voting rights',
                },
                {
                    name: 'Capped Supply',
                    description: 'Maximum supply limit for regulatory compliance',
                },
                {
                    name: 'Controller',
                    description:
                        'Controlled transfers and forced transfer capability',
                },
            ],
            erc3643Core: [
                {
                    name: 'Metadata',
                    description:
                        'Extended metadata with onchainID and version tracking',
                },
                {
                    name: 'Freeze',
                    description: 'Address and partial token freezing capabilities',
                },
                {
                    name: 'Recovery',
                    description: 'Lost or locked token recovery mechanism',
                },
            ],
            compliance: [
                {
                    name: 'Base Compliance Engine',
                    description: 'Transfer validation and compliance checking',
                },
                {
                    name: 'Max Balance Limit',
                    description: 'Per-address maximum balance enforcement',
                },
                {
                    name: 'Daily/Monthly Limits',
                    description: 'Temporal transfer volume restrictions',
                },
            ],
        },
        roles: [
            {
                role: 'DEFAULT_ADMIN_ROLE',
                description: 'Full administrative control',
            },
            {
                role: 'METADATA_ROLE',
                description: 'Update token metadata and onchainID',
            },
            {
                role: 'FREEZE_ROLE',
                description: 'Freeze/unfreeze addresses and tokens',
            },
            {
                role: 'RECOVERY_ROLE',
                description: 'Recover lost or locked tokens',
            },
            {
                role: 'COMPLIANCE_ROLE',
                description: 'Configure compliance rules and limits',
            },
            {
                role: 'CONTROLLER_ROLE',
                description: 'Execute forced transfers',
            },
            {
                role: 'CAP_ROLE',
                description: 'Adjust supply cap (if needed)',
            },
            {
                role: 'SNAPSHOT_ROLE',
                description: 'Create balance snapshots',
            },
            {
                role: 'PAUSER_ROLE',
                description: 'Pause/unpause token operations',
            },
        ],
    }
}

// Generate configuration
console.log('🔐 Generating ERC3643 Security Token Configuration...\n')

const config = generateSecurityTokenConfig()

const output = {
    generated: new Date().toISOString(),
    network: 'any',
    algorithm:
        'Position-Based XOR (ADR-003) with lexicographically sorted resolver keys',
    note: 'Configuration ID is deterministic - same facet selection always produces same ID',
    configuration: config,
}

// Ensure sdk/config directory exists
const sdkConfigDir = join(__dirname, '../../sdk/config')
const outputPath = join(sdkConfigDir, 'erc3643-configuration.json')

try {
    writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log('✅ ERC3643 Security Token configuration generated successfully!\n')
    console.log('📋 Configuration Details:')
    console.log(`   Name:             ${config.name}`)
    console.log(`   Seed:             ${config.seed}`)
    console.log(`   Configuration ID: ${config.configurationId}`)
    console.log(`   Total Facets:     ${config.facets.length}`)
    console.log(`   Resolver Keys:    ${Object.values(config.resolverKeys).flat().length}`)
    console.log(`   Output File:      ${outputPath}\n`)
    console.log('💡 This configuration includes:')
    console.log('   - ERC20 base functionality')
    console.log('   - Snapshot, Capped, Controller extensions')
    console.log('   - Complete ERC3643 compliance stack')
    console.log('   - All 6 ERC3643 facets (Metadata, Freeze, Recovery, Compliance)')
} catch (error) {
    console.error('❌ Error writing configuration file:', error)
    process.exit(1)
}
