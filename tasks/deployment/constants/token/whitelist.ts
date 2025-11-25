import { WHITELIST_RESOLVER_KEYS } from '../resolverKeys'
import { ARTIFACT_PATHS, CONTRACT_NAMES } from '../configurationIds'

/**
 * Whitelist extension (transversal - shared by ERC20, ERC721, ERC3643)
 * This is NOT a compliance module, but a transversal extension applicable to any token standard
 */
export const WHITELIST_DEFINITIONS = [
    {
        description: CONTRACT_NAMES.BASIC_WHITELIST,
        key: WHITELIST_RESOLVER_KEYS.BASIC_WHITELIST,
        contractName: CONTRACT_NAMES.BASIC_WHITELIST,
        artifactPath: ARTIFACT_PATHS.BASIC_WHITELIST,
    },
]
