import {
    ERC3643_RESOLVER_KEYS,
    ERC20_ERC3643_SHARED_RESOLVER_KEYS,
} from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

/**
 * ERC203643 Shared Facets (used by both ERC20 and ERC3643)
 * These facets must be deployed as they are required by SECURITY_TOKEN configuration
 */
export const ERC203643_SHARED_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ERC203643_CAPPED,
        key: ERC20_ERC3643_SHARED_RESOLVER_KEYS.CAPPED,
        contractName: CONTRACT_NAMES.ERC203643_CAPPED,
        artifactPath: ARTIFACT_PATHS.ERC203643_CAPPED,
    },
    {
        description: CONTRACT_NAMES.ERC203643_CONTROLLER,
        key: ERC20_ERC3643_SHARED_RESOLVER_KEYS.CONTROLLER,
        contractName: CONTRACT_NAMES.ERC203643_CONTROLLER,
        artifactPath: ARTIFACT_PATHS.ERC203643_CONTROLLER,
    },
]

/**
 * ERC3643-specific Facets (compliance and regulatory features)
 */
export const ERC3643_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.ERC3643_METADATA,
        key: ERC3643_RESOLVER_KEYS.METADATA,
        contractName: CONTRACT_NAMES.ERC3643_METADATA,
        artifactPath: ARTIFACT_PATHS.ERC3643_METADATA,
    },
    {
        description: CONTRACT_NAMES.ERC3643_FREEZE,
        key: ERC3643_RESOLVER_KEYS.FREEZE,
        contractName: CONTRACT_NAMES.ERC3643_FREEZE,
        artifactPath: ARTIFACT_PATHS.ERC3643_FREEZE,
    },
    {
        description: CONTRACT_NAMES.ERC3643_RECOVERY,
        key: ERC3643_RESOLVER_KEYS.RECOVERY,
        contractName: CONTRACT_NAMES.ERC3643_RECOVERY,
        artifactPath: ARTIFACT_PATHS.ERC3643_RECOVERY,
    },
    {
        description: CONTRACT_NAMES.ERC3643_COMPLIANCE,
        key: ERC3643_RESOLVER_KEYS.COMPLIANCE,
        contractName: CONTRACT_NAMES.ERC3643_COMPLIANCE,
        artifactPath: ARTIFACT_PATHS.ERC3643_COMPLIANCE,
    },
    {
        description: CONTRACT_NAMES.ERC3643_COMPLIANCE_MAXBAL,
        key: ERC3643_RESOLVER_KEYS.COMPLIANCE_MAXBALANCE,
        contractName: CONTRACT_NAMES.ERC3643_COMPLIANCE_MAXBAL,
        artifactPath: ARTIFACT_PATHS.ERC3643_COMPLIANCE_MAXBAL,
    },
    {
        description: CONTRACT_NAMES.ERC3643_COMPLIANCE_DMLIM,
        key: ERC3643_RESOLVER_KEYS.COMPLIANCE_DMLIM,
        contractName: CONTRACT_NAMES.ERC3643_COMPLIANCE_DMLIM,
        artifactPath: ARTIFACT_PATHS.ERC3643_COMPLIANCE_DMLIM,
    },
]
